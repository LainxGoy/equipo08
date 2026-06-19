import { Controller, Get, Post, Body, Req } from '@nestjs/common';
import { AjustesService } from './ajustes.service';
import { TenantId } from '../tenant/tenant-id.decorator';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { CreateAjusteDto } from './dto/create-ajuste.dto';

@Controller('ajustes')
export class AjustesController {
  constructor(private readonly ajustesService: AjustesService) {}

  @Get()
  @RequirePermission('inventario.ver')
  findAll(@TenantId() tenant_id: string) {
    return this.ajustesService.findAll(tenant_id);
  }

  @Post()
  @RequirePermission('inventario.crear')
  create(
    @TenantId() tenant_id: string,
    @Req() req: any,
    @Body() dto: CreateAjusteDto,
  ) {
    const usuario_id = req.user.userId;
    const userRole = req.user.role;
    return this.ajustesService.create(tenant_id, usuario_id, userRole, dto);
  }
}
