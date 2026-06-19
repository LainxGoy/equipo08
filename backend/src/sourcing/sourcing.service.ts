import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoteIngreso } from './lote-ingreso.entity';
import { CreateLoteIngresoDto } from './dto/create-lote.dto';
import { Producto } from '../productos/producto.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { StockService } from '../stock/stock.service';
import { MovimientoInventarioTipo } from '../stock/movimiento-inventario.entity';

@Injectable()
export class SourcingService {
  constructor(
    @InjectRepository(LoteIngreso)
    private readonly loteRep: Repository<LoteIngreso>,
    private readonly dataSource: DataSource,
    private readonly stockService: StockService,
  ) {}

  async registrarIngreso(
    tenant_id: string,
    dto: CreateLoteIngresoDto,
  ): Promise<LoteIngreso> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const producto = await queryRunner.manager.findOne(Producto, {
        where: { id: dto.producto_id, tenant_id },
      });
      if (!producto) throw new NotFoundException('Producto no encontrado');

      const sucursal = await queryRunner.manager.findOne(Sucursal, {
        where: { id: dto.sucursal_id, tenant_id },
      });
      if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
      if (!sucursal.isActive) {
        throw new BadRequestException(
          `La sucursal "${sucursal.name}" esta inactiva o clausurada. No se pueden registrar ingresos en ella.`,
        );
      }

      if (producto.proveedor_id !== dto.proveedor_id) {
        throw new BadRequestException(
          'No puedes ingresar un lote con un proveedor distinto al oficial del producto. Por favor actualiza el proveedor en el Catalogo si es necesario.',
        );
      }

      const costoUnitario = Number(producto.precioCosto || 0);
      const lote = queryRunner.manager.create(LoteIngreso, {
        ...dto,
        tenant_id,
        costoUnitarioSnapshot: costoUnitario,
      });
      const loteGuardado = await queryRunner.manager.save(lote);

      await this.stockService.applyStockDelta(
        queryRunner.manager,
        tenant_id,
        dto.sucursal_id,
        dto.producto_id,
        Number(dto.cantidad || 0),
        Number(dto.cantidad || 0) * costoUnitario,
        {
          tipo: MovimientoInventarioTipo.INGRESO,
          referencia_tipo: 'LOTE_INGRESO',
          referencia_id: loteGuardado.id,
          observaciones: 'Ingreso de lote',
        },
      );

      await queryRunner.commitTransaction();
      return loteGuardado;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getHistorial(tenant_id: string): Promise<LoteIngreso[]> {
    return this.loteRep.find({
      where: { tenant_id },
      relations: ['producto', 'proveedor', 'sucursal'],
      order: { fechaIngreso: 'DESC' },
    });
  }

  async update(
    tenant_id: string,
    id: string,
    dto: Partial<CreateLoteIngresoDto>,
  ): Promise<LoteIngreso> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lote = await queryRunner.manager.findOne(LoteIngreso, {
        where: { id, tenant_id },
      });
      if (!lote) throw new NotFoundException('Lote no encontrado');

      const previous = {
        sucursal_id: lote.sucursal_id,
        producto_id: lote.producto_id,
        cantidad: Number(lote.cantidad || 0),
        valor:
          Number(lote.cantidad || 0) * Number(lote.costoUnitarioSnapshot || 0),
      };

      Object.assign(lote, dto);

      const producto = await queryRunner.manager.findOne(Producto, {
        where: { id: lote.producto_id, tenant_id },
      });
      if (!producto) throw new NotFoundException('Producto no encontrado');

      const sucursal = await queryRunner.manager.findOne(Sucursal, {
        where: { id: lote.sucursal_id, tenant_id },
      });
      if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
      if (!sucursal.isActive) {
        throw new BadRequestException(
          `La sucursal "${sucursal.name}" esta inactiva o clausurada. No se pueden registrar ingresos en ella.`,
        );
      }

      if (producto.proveedor_id !== lote.proveedor_id) {
        throw new BadRequestException(
          'No puedes ingresar un lote con un proveedor distinto al oficial del producto. Por favor actualiza el proveedor en el Catalogo si es necesario.',
        );
      }

      lote.costoUnitarioSnapshot = Number(producto.precioCosto || 0);
      const loteGuardado = await queryRunner.manager.save(lote);
      const currentValue =
        Number(loteGuardado.cantidad || 0) *
        Number(loteGuardado.costoUnitarioSnapshot || 0);

      if (
        previous.sucursal_id === loteGuardado.sucursal_id &&
        previous.producto_id === loteGuardado.producto_id
      ) {
        await this.stockService.applyStockDelta(
          queryRunner.manager,
          tenant_id,
          loteGuardado.sucursal_id,
          loteGuardado.producto_id,
          Number(loteGuardado.cantidad || 0) - previous.cantidad,
          currentValue - previous.valor,
          {
            tipo: MovimientoInventarioTipo.CORRECCION,
            referencia_tipo: 'LOTE_INGRESO',
            referencia_id: loteGuardado.id,
            observaciones: 'Actualizacion de lote',
          },
        );
      } else {
        await this.stockService.applyStockDelta(
          queryRunner.manager,
          tenant_id,
          previous.sucursal_id,
          previous.producto_id,
          -previous.cantidad,
          -previous.valor,
          {
            tipo: MovimientoInventarioTipo.CORRECCION,
            referencia_tipo: 'LOTE_INGRESO',
            referencia_id: loteGuardado.id,
            observaciones: 'Reversion por cambio de lote',
          },
        );

        await this.stockService.applyStockDelta(
          queryRunner.manager,
          tenant_id,
          loteGuardado.sucursal_id,
          loteGuardado.producto_id,
          Number(loteGuardado.cantidad || 0),
          currentValue,
          {
            tipo: MovimientoInventarioTipo.CORRECCION,
            referencia_tipo: 'LOTE_INGRESO',
            referencia_id: loteGuardado.id,
            observaciones: 'Aplicacion por cambio de lote',
          },
        );
      }

      await queryRunner.commitTransaction();
      return loteGuardado;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(tenant_id: string, id: string): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lote = await queryRunner.manager.findOne(LoteIngreso, {
        where: { id, tenant_id },
      });
      if (!lote) throw new NotFoundException('Lote no encontrado');

      const valorLote =
        Number(lote.cantidad || 0) * Number(lote.costoUnitarioSnapshot || 0);
      await queryRunner.manager.remove(lote);

      await this.stockService.applyStockDelta(
        queryRunner.manager,
        tenant_id,
        lote.sucursal_id,
        lote.producto_id,
        -Number(lote.cantidad || 0),
        -valorLote,
        {
          tipo: MovimientoInventarioTipo.CORRECCION,
          referencia_tipo: 'LOTE_INGRESO',
          referencia_id: id,
          observaciones: 'Eliminacion de lote',
        },
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
