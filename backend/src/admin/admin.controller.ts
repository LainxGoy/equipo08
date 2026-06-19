import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { AdminService } from './admin.service';
import { TenantStatus } from '../tenant/tenant.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Admin Global')
@ApiBearerAuth('access-token')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('tenants')
  @ApiOperation({
    summary: 'Listar todas las tiendas',
    description:
      'Obtiene el directorio completo de todas las tiendas (tenants) registradas en el sistema. Solo para SUPER_ADMIN.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de tiendas obtenida correctamente.',
  })
  async getAllTenants() {
    return this.adminService.getAllTenants();
  }

  @Get('metrics')
  @ApiOperation({
    summary: 'Métricas Globales',
    description:
      'Obtiene las métricas totales del mall (tiendas pendientes, aprobadas, etc.).',
  })
  @ApiResponse({
    status: 200,
    description: 'Métricas obtenidas correctamente.',
  })
  async getDashboardMetrics() {
    return this.adminService.getDashboardMetrics();
  }

  @Patch('tenants/:id/status')
  @ApiOperation({
    summary: 'Aprobar o Rechazar Tienda',
    description:
      'Actualiza el estado de una tienda (ej. de PENDING a APPROVED).',
  })
  @ApiParam({ name: 'id', description: 'UUID de la tienda (Tenant)' })
  @ApiBody({ schema: { example: { status: 'APPROVED' } } })
  @ApiResponse({ status: 200, description: 'Estado de la tienda actualizado.' })
  @ApiResponse({ status: 404, description: 'Tienda no encontrada.' })
  async updateTenantStatus(
    @Param('id') id: string,
    @Body('status') status: TenantStatus,
  ) {
    return this.adminService.updateTenantStatus(id, status);
  }
}
