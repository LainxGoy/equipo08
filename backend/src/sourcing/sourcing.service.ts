import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { LoteIngreso } from './lote-ingreso.entity';
import { CreateLoteIngresoDto } from './dto/create-lote.dto';
import { Stock } from '../stock/stock.entity';
import { StockService } from '../stock/stock.service';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Producto } from '../productos/producto.entity';

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
    usuario_id?: string,
  ): Promise<any> {
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

      // Prioridad: costo del DTO > precioCosto del catálogo
      const costoUnitario = dto.costoUnitario != null && dto.costoUnitario > 0
        ? Number(dto.costoUnitario)
        : Number(producto.precioCosto || 0);

      // Buscar o crear stock_id
      let stock = await queryRunner.manager.findOne(Stock, {
        where: { tenant_id, sucursal_id: dto.sucursal_id, producto_id: dto.producto_id },
      });
      if (!stock) {
        stock = queryRunner.manager.create(Stock, {
          tenant_id,
          sucursal_id: dto.sucursal_id,
          producto_id: dto.producto_id,
          cantidadActual: 0,
          costoPromedio: 0,
        });
        stock = await queryRunner.manager.save(stock);
      }

      const lote = queryRunner.manager.create(LoteIngreso, {
        tenant_id,
        stock_id: stock.id,
        cantidad: dto.cantidad,
        costoUnitario,
        fechaElaboracion: dto.fechaElaboracion,
        fechaVencimiento: dto.fechaVencimiento,
        usuario_id,
      });
      const loteGuardado = await queryRunner.manager.save(lote);

      await this.stockService.applyStockDelta(
        queryRunner.manager,
        tenant_id,
        dto.sucursal_id,
        dto.producto_id,
        Number(dto.cantidad || 0),
        Number(dto.cantidad || 0) * costoUnitario,
        'INGRESO',
        `Lote de ingreso ${loteGuardado.id}`,
        undefined,
        usuario_id,
        'COMPRA',
        loteGuardado.id,
      );

      await queryRunner.commitTransaction();
      
      // Mapear para compatibilidad con el frontend
      return {
        ...loteGuardado,
        producto_id: dto.producto_id,
        sucursal_id: dto.sucursal_id,
        producto,
        sucursal,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getHistorial(tenant_id: string): Promise<any[]> {
    const lotes = await this.loteRep.find({
      where: { tenant_id },
      relations: ['stock', 'stock.producto', 'stock.producto.proveedor', 'stock.sucursal'],
      order: { fechaIngreso: 'DESC' },
    });

    // Mapear para compatibilidad 100% con el frontend actual
    return lotes.map(l => ({
      ...l,
      producto_id: l.stock?.producto_id,
      sucursal_id: l.stock?.sucursal_id,
      producto: l.stock?.producto,
      sucursal: l.stock?.sucursal,
    }));
  }

  async update(
    tenant_id: string,
    id: string,
    dto: Partial<CreateLoteIngresoDto>,
  ): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const lote = await queryRunner.manager.findOne(LoteIngreso, {
        where: { id, tenant_id },
        relations: ['stock'],
      });
      if (!lote) throw new NotFoundException('Lote no encontrado');

      const currentProductoId = dto.producto_id || lote.stock?.producto_id;
      const currentSucursalId = dto.sucursal_id || lote.stock?.sucursal_id;

      const previous = {
        sucursal_id: lote.stock?.sucursal_id,
        producto_id: lote.stock?.producto_id,
        cantidad: Number(lote.cantidad || 0),
        valor: Number(lote.cantidad || 0) * Number(lote.costoUnitario || 0),
      };

      const producto = await queryRunner.manager.findOne(Producto, {
        where: { id: currentProductoId, tenant_id },
      });
      if (!producto) throw new NotFoundException('Producto no encontrado');

      const sucursal = await queryRunner.manager.findOne(Sucursal, {
        where: { id: currentSucursalId, tenant_id },
      });
      if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
      if (!sucursal.isActive) {
        throw new BadRequestException(
          `La sucursal "${sucursal.name}" esta inactiva o clausurada. No se pueden registrar ingresos en ella.`,
        );
      }

      // Buscar o crear stock_id nuevo
      let stock = await queryRunner.manager.findOne(Stock, {
        where: { tenant_id, sucursal_id: currentSucursalId, producto_id: currentProductoId },
      });
      if (!stock) {
        stock = queryRunner.manager.create(Stock, {
          tenant_id,
          sucursal_id: currentSucursalId,
          producto_id: currentProductoId,
          cantidadActual: 0,
          costoPromedio: 0,
        });
        stock = await queryRunner.manager.save(stock);
      }

      lote.stock_id = stock.id;
      if (dto.cantidad !== undefined) lote.cantidad = dto.cantidad;
      if (dto.fechaElaboracion !== undefined) lote.fechaElaboracion = dto.fechaElaboracion;
      if (dto.fechaVencimiento !== undefined) lote.fechaVencimiento = dto.fechaVencimiento;
      lote.costoUnitario = Number(producto.precioCosto || 0);

      const loteGuardado = await queryRunner.manager.save(lote);
      const currentValue =
        Number(loteGuardado.cantidad || 0) *
        Number(loteGuardado.costoUnitario || 0);

      if (
        previous.sucursal_id === currentSucursalId &&
        previous.producto_id === currentProductoId
      ) {
        await this.stockService.applyStockDelta(
          queryRunner.manager,
          tenant_id,
          currentSucursalId,
          currentProductoId,
          Number(loteGuardado.cantidad || 0) - previous.cantidad,
          currentValue - previous.valor,
          'INGRESO',
          `Modificación lote de ingreso ${loteGuardado.id}`,
          undefined,
          undefined,
          'COMPRA',
          loteGuardado.id,
        );
      } else {
        // Desasociar del anterior
        await this.stockService.applyStockDelta(
          queryRunner.manager,
          tenant_id,
          previous.sucursal_id,
          previous.producto_id,
          -previous.cantidad,
          -previous.valor,
          'EGRESO',
          `Modificación lote de ingreso (desasociación) ${loteGuardado.id}`,
          undefined,
          undefined,
          'COMPRA',
          loteGuardado.id,
        );

        // Asociar al nuevo
        await this.stockService.applyStockDelta(
          queryRunner.manager,
          tenant_id,
          currentSucursalId,
          currentProductoId,
          Number(loteGuardado.cantidad || 0),
          currentValue,
          'INGRESO',
          `Modificación lote de ingreso (asociación) ${loteGuardado.id}`,
          undefined,
          undefined,
          'COMPRA',
          loteGuardado.id,
        );
      }

      await queryRunner.commitTransaction();
      
      return {
        ...loteGuardado,
        producto_id: currentProductoId,
        sucursal_id: currentSucursalId,
        producto,
        sucursal,
      };
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
        relations: ['stock'],
      });
      if (!lote) throw new NotFoundException('Lote no encontrado');

      const valorLote =
        Number(lote.cantidad || 0) * Number(lote.costoUnitario || 0);
      
      const sucursalId = lote.stock?.sucursal_id;
      const productoId = lote.stock?.producto_id;

      await queryRunner.manager.remove(lote);

      if (sucursalId && productoId) {
        await this.stockService.applyStockDelta(
          queryRunner.manager,
          tenant_id,
          sucursalId,
          productoId,
          -Number(lote.cantidad || 0),
          -valorLote,
          'EGRESO',
          `Eliminación de lote de ingreso ${lote.id}`,
          undefined,
          undefined,
          'COMPRA',
          lote.id,
        );
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
