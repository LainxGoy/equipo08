import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';
import { TenantId } from './tenant-id.decorator';
import { TenantService } from './tenant.service';

@Controller('tenant')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get('profile')
  async getProfile(@TenantId() tenantId: string) {
    return this.tenantService.getProfile(tenantId);
  }

  @Patch('profile')
  @Roles(UserRole.OWNER)
  async updateProfile(
    @TenantId() tenantId: string,
    @Body() data: { name?: string; phone?: string; logoUrl?: string; brandColor?: string }
  ) {
    return this.tenantService.updateProfile(tenantId, data);
  }
}
