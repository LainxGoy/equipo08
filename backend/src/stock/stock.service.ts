import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Stock } from './stock.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';
import { ProductoVariacion } from '../productos/producto-variacion.entity';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRep: Repository<Stock>,
    private readonly dataSource: DataSource,
  ) {}

  // Helper para buscar o resolver dinámicamente la variante por defecto si no se pasa producto_variacion_id
  private async resolveVariacionId(
    manager: EntityManager,
    tenant_id: string,
    producto_id: string,
    producto_variacion_id?: string,
  ): Promise<string> {
    if (producto_variacion_id) return producto_variacion_id;

    // Buscar variante por defecto del producto
    const variant = await manager.findOne(ProductoVariacion, {
      where: { producto: { id: producto_id, tenant_id } },
      order: { createdAt: 'ASC' },
    });
    if (!variant) {
      // En caso extremo que no tenga variantes, la creamos al vuelo para no romper transaccionalidad
      const newVar = manager.create(ProductoVariacion, {
        producto_id,
        sku: `SKU-${producto_id.split('-')[0]}`,
        precioCosto: 0,
        precioVenta: 0,
        opciones: {},
      });
      const saved = await manager.save(newVar);
      return saved.id;
    }
    return variant.id;
  }

  async getStockRow(
    tenant_id: string,
    sucursal_id: string,
    producto_id: string,
    producto_variacion_id?: string,
  ): Promise<Stock | null> {
    const varId = await this.resolveVariacionId(this.stockRep.manager, tenant_id, producto_id, producto_variacion_id);
    return this.stockRep.findOne({
      where: { tenant_id, sucursal_id, producto_variacion_id: varId },
    });
  }

  async sumStock(
    tenant_id: string,
    sucursal_id: string,
    producto_id: string,
    cantidad: number,
    valorAdquisicionDelta: number = 0,
    tipo: string = 'AJUSTE',
    motivo?: string,
    usuario_id?: string,
    referencia_tipo?: string,
    referencia_id?: string,
    producto_variacion_id?: string,
  ): Promise<Stock> {
    return this.applyStockDelta(
      this.stockRep.manager,
      tenant_id,
      sucursal_id,
      producto_id,
      cantidad,
      valorAdquisicionDelta,
      tipo,
      motivo,
      undefined,
      usuario_id,
      referencia_tipo,
      referencia_id,
      producto_variacion_id,
    );
  }

  async applyStockDelta(
    manager: EntityManager,
    tenant_id: string,
    sucursal_id: string,
    producto_id: string,
    cantidad: number,
    valorAdquisicionDelta: number = 0,
    tipo: string = 'AJUSTE',
    motivo?: string,
    existingStock?: Stock,
    usuario_id?: string,
    referencia_tipo?: string,
    referencia_id?: string,
    producto_variacion_id?: string,
  ): Promise<Stock> {
    const varId = await this.resolveVariacionId(manager, tenant_id, producto_id, producto_variacion_id);

    let stock = existingStock || await manager.findOne(Stock, {
      where: { tenant_id, sucursal_id, producto_variacion_id: varId },
    });

    const stockAnterior = stock ? Number(stock.cantidadActual || 0) : 0;
    const costoPromedioAnterior = stock ? Number(stock.costoPromedio || 0) : 0;

    let nuevoCostoPromedio = costoPromedioAnterior;
    const deltaCantidad = Number(cantidad || 0);

    if (!stock) {
      const initialCost = deltaCantidad > 0 ? Math.abs(Number(valorAdquisicionDelta)) / deltaCantidad : 0;
      stock = manager.create(Stock, {
        tenant_id,
        sucursal_id,
        producto_id,
        producto_variacion_id: varId,
        cantidadActual: deltaCantidad,
        costoPromedio: initialCost,
      });
    } else {
      const nuevaCantidad = stockAnterior + deltaCantidad;
      if (nuevaCantidad < 0) {
        throw new BadRequestException('El stock no puede quedar negativo');
      }

      if (deltaCantidad > 0) {
        const costoEntradaUnitario = Math.abs(Number(valorAdquisicionDelta)) / deltaCantidad;
        const valorActualTotal = stockAnterior * costoPromedioAnterior;
        const nuevoValorTotal = valorActualTotal + Math.abs(Number(valorAdquisicionDelta));
        nuevoCostoPromedio = nuevaCantidad > 0 ? nuevoValorTotal / nuevaCantidad : 0;
      } else {
        nuevoCostoPromedio = costoPromedioAnterior;
      }

      stock.cantidadActual = nuevaCantidad;
      stock.costoPromedio = nuevoCostoPromedio;
      // Por si el registro de stock viejo no tenía seteado el producto_variacion_id
      if (!stock.producto_variacion_id) {
        stock.producto_variacion_id = varId;
      }
    }

    const savedStock = await manager.save(Stock, stock);
    const stockResultante = savedStock ? savedStock.cantidadActual : stock.cantidadActual;

    const movimiento = manager.create(MovimientoInventario, {
      tenant_id,
      stock_id: savedStock?.id || stock.id || 'mock-stock-id',
      tipo,
      cantidadDelta: cantidad,
      stockAnterior,
      stockResultante,
      costoUnitario: nuevoCostoPromedio,
      motivo,
      usuario_id,
      referenciaTipo: referencia_tipo,
      referenciaId: referencia_id,
    });
    await manager.save(MovimientoInventario, movimiento);

    return savedStock || stock;
  }

  async getStockByTenant(tenant_id: string): Promise<any[]> {
    const stocks = await this.stockRep.find({
      where: { tenant_id },
      relations: ['producto', 'sucursal', 'variacion'],
      order: {
        sucursal_id: 'ASC',
      },
    });

    return stocks.map(s => {
      const cant = Number(s.cantidadActual || 0);
      const cp = Number(s.costoPromedio || 0);
      return {
        ...s,
        cantidadTotal: cant,
        valorAdquisicion: cant * cp,
      };
    });
  }

  async transferStock(
    tenant_id: string,
    from_sucursal_id: string,
    to_sucursal_id: string,
    producto_id: string,
    cantidad: number,
    producto_variacion_id?: string,
  ): Promise<void> {
    if (from_sucursal_id === to_sucursal_id) {
      throw new BadRequestException(
        'No se puede transferir a la misma sucursal',
      );
    }
    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser mayor a cero');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const varId = await this.resolveVariacionId(queryRunner.manager, tenant_id, producto_id, producto_variacion_id);

      // Bloquear registro origen
      const sourceStock = await queryRunner.manager.findOne(Stock, {
        where: { tenant_id, sucursal_id: from_sucursal_id, producto_variacion_id: varId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!sourceStock || sourceStock.cantidadActual < cantidad) {
        throw new BadRequestException(
          `Stock insuficiente en sucursal origen. Disponible: ${sourceStock ? sourceStock.cantidadActual : 0}`,
        );
      }

      const avgCost = Number(sourceStock.costoPromedio || 0);
      const transferredValue = avgCost * cantidad;

      // Descontar de origen utilizando applyStockDelta
      await this.applyStockDelta(
        queryRunner.manager,
        tenant_id,
        from_sucursal_id,
        producto_id,
        -cantidad,
        -transferredValue,
        'TRANSFERENCIA',
        `Transferencia salida a sucursal ${to_sucursal_id}`,
        sourceStock,
        undefined,
        undefined,
        undefined,
        varId,
      );

      // Bloquear/Crear registro destino
      const targetStock = await queryRunner.manager.findOne(Stock, {
        where: { tenant_id, sucursal_id: to_sucursal_id, producto_variacion_id: varId },
        lock: { mode: 'pessimistic_write' },
      });

      // Incrementar en destino utilizando applyStockDelta
      await this.applyStockDelta(
        queryRunner.manager,
        tenant_id,
        to_sucursal_id,
        producto_id,
        cantidad,
        transferredValue,
        'TRANSFERENCIA',
        `Transferencia entrada desde sucursal ${from_sucursal_id}`,
        targetStock || undefined,
        undefined,
        undefined,
        undefined,
        varId,
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async getKardex(tenant_id: string, productoId: string): Promise<any[]> {
    const query = this.stockRep.manager
      .createQueryBuilder(MovimientoInventario, 'movimiento')
      .innerJoinAndSelect('movimiento.stock', 'stock')
      .leftJoinAndSelect('stock.sucursal', 'sucursal')
      .leftJoinAndSelect('stock.variacion', 'variacion')
      .leftJoinAndSelect('movimiento.usuario', 'usuario')
      .where('movimiento.tenant_id = :tenant_id', { tenant_id })
      .andWhere('stock.producto_id = :productoId', { productoId })
      .orderBy('movimiento.createdAt', 'DESC');

    const result = await query.getMany();

    return result.map(m => ({
      id: m.id,
      fecha: m.createdAt,
      tipo: m.tipo,
      cantidadDelta: m.cantidadDelta,
      stockAnterior: Number(m.stockAnterior || 0),
      stockResultante: Number(m.stockResultante || 0),
      costoUnitario: Number(m.costoUnitario || 0),
      motivo: m.motivo,
      usuarioNombre: m.usuario?.name || 'Sistema',
      referenciaTipo: m.referenciaTipo,
      referenciaId: m.referenciaId,
      sucursalNombre: m.stock?.sucursal?.name || 'General',
      variacionDetalle: m.stock?.variacion?.opciones || null,
      sku: m.stock?.variacion?.sku || null,
    }));
  }
}
