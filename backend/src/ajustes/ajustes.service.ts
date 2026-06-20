import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AjusteInventario } from './ajuste.entity';
import { CreateAjusteDto } from './dto/create-ajuste.dto';
import { StockService } from '../stock/stock.service';
import { MovimientoInventarioTipo } from '../stock/movimiento-inventario.entity';

@Injectable()
export class AjustesService {
  constructor(
    @InjectRepository(AjusteInventario)
    private readonly ajusteRep: Repository<AjusteInventario>,
    private readonly stockService: StockService,
  ) {}

  async create(
    tenant_id: string,
    usuario_id: string,
    userRole: string,
    dto: CreateAjusteDto,
  ): Promise<AjusteInventario> {
    if (dto.cantidad_fisica > dto.cantidad_sistema && userRole !== 'OWNER') {
      throw new BadRequestException(
        'Auditoría Rechazada: No puede registrar más stock del existente (Detección de excedente anómalo). Para ingresar stock nuevo legitímo sin registrar, debe crearse un nuevo Lote de Sourcing.',
      );
    }

    const stockActual = await this.stockService.getStockRow(
      tenant_id,
      dto.sucursal_id,
      dto.producto_id,
    );
    let avgCost = 0;
    if (stockActual && stockActual.cantidadTotal > 0) {
      avgCost =
        Number(stockActual.valorAdquisicion) / stockActual.cantidadTotal;
    }

    const unitsLost = dto.cantidad_sistema - dto.cantidad_fisica;
    const valor_perdido = unitsLost > 0 ? unitsLost * avgCost : 0;

    // 1. Guardar el Acta de Ajuste (Auditoría Lineal)
    const nuevoAjuste = this.ajusteRep.create({
      tenant_id,
      usuario_id,
      stock_id: stockActual?.id,
      ...dto,
      valor_perdido,
    });
    const guardado = await this.ajusteRep.save(nuevoAjuste);

    // 2. Sincronizador Transversal: Forzar la actualización del Stock Físico a la cantidad reportada.
    const diferencia = dto.cantidad_fisica - dto.cantidad_sistema;

    // El método sumStock del StockService acepta valores negativos
    await this.stockService.sumStock(
      tenant_id,
      dto.sucursal_id,
      dto.producto_id,
      diferencia,
      -valor_perdido,
      {
        tipo: MovimientoInventarioTipo.AJUSTE,
        referencia_tipo: 'AJUSTE_INVENTARIO',
        referencia_id: guardado.id,
        usuario_id,
        observaciones: dto.observaciones || dto.motivo,
      },
    );

    return guardado;
  }

  async findAll(tenant_id: string): Promise<AjusteInventario[]> {
    return this.ajusteRep.find({
      where: { tenant_id },
      relations: ['sucursal', 'producto', 'usuario'],
      order: { fecha: 'DESC' },
    });
  }
}
