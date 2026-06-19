import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { TenantId } from '../tenant/tenant-id.decorator';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Proveedores')
@Controller('proveedores')
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  @RequirePermission('proveedores.crear')
  create(
    @TenantId() tenantId: string,
    @Body() createProveedorDto: CreateProveedorDto,
  ) {
    return this.proveedoresService.create(tenantId, createProveedorDto);
  }

  @Get('global/:nit')
  @RequirePermission('proveedores.ver')
  findByGlobalNit(@Param('nit') nit: string) {
    return this.proveedoresService.findByGlobalNit(nit);
  }

  @Get()
  @RequirePermission('proveedores.ver')
  findAll(@TenantId() tenantId: string) {
    return this.proveedoresService.findAll(tenantId);
  }

  @Put(':id')
  @RequirePermission('proveedores.editar')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateProveedorDto>,
  ) {
    return this.proveedoresService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('proveedores.eliminar')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.proveedoresService.remove(tenantId, id);
  }
}
