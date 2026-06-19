import { Controller, Get, Post, Body } from '@nestjs/common';
import { StockService } from './stock.service';
import { TransferStockDto } from './dto/transfer-stock.dto';
import { TenantId } from '../tenant/tenant-id.decorator';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Stock')
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @RequirePermission('inventario.ver')
  getStock(@TenantId() tenantId: string) {
    return this.stockService.getStockByTenant(tenantId);
  }

  @Post('transfer')
  @RequirePermission('inventario.editar') // or inventario.crear depending on roles
  transferStock(@TenantId() tenantId: string, @Body() dto: TransferStockDto) {
    return this.stockService.transferStock(
      tenantId,
      dto.from_sucursal_id,
      dto.to_sucursal_id,
      dto.producto_id,
      dto.cantidad,
    );
  }
}
