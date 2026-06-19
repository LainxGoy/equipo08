import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';
import { TenantId } from '../tenant/tenant-id.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { UserRole } from './user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermission('usuarios.crear')
  create(@TenantId() tenant_id: string, @Body() dto: CreateUserDto) {
    return this.usersService.create(tenant_id, dto);
  }

  @Get()
  @RequirePermission('usuarios.ver')
  findAll(@TenantId() tenant_id: string) {
    return this.usersService.findAll(tenant_id);
  }

  @Get('me')
  async getMe(@TenantId() tenant_id: string, @Req() req: any) {
    const user = await this.usersService.findOne(tenant_id, req.user.userId);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      sucursal_id: user.sucursal_id,
      sucursal_name: user.sucursal?.name || null,
    };
  }

  @Get('permissions')
  getPermissions(@TenantId() tenant_id: string) {
    return this.usersService.getPermissions(tenant_id);
  }

  @Put('permissions')
  @Roles(UserRole.OWNER)
  updatePermissions(
    @TenantId() tenant_id: string,
    @Body() dto: UpdatePermissionsDto,
  ) {
    return this.usersService.updatePermissions(tenant_id, dto);
  }

  @Get(':id')
  @RequirePermission('usuarios.ver')
  findOne(@TenantId() tenant_id: string, @Param('id') id: string) {
    return this.usersService.findOne(tenant_id, id);
  }

  @Delete(':id')
  @RequirePermission('usuarios.eliminar')
  remove(@TenantId() tenant_id: string, @Param('id') id: string) {
    return this.usersService.remove(tenant_id, id);
  }

  @Put(':id')
  @RequirePermission('usuarios.editar')
  update(
    @TenantId() tenant_id: string,
    @Param('id') id: string,
    @Body() dto: Partial<CreateUserDto>,
    @Req() req: any,
  ) {
    return this.usersService.update(tenant_id, id, dto, req.user.userId);
  }
}
