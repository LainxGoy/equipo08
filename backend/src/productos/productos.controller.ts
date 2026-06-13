import { Controller, Get, Post, Body, Put, Param, Delete, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { CreateProductoDto } from './dto/create-producto.dto';
import { TenantId } from '../tenant/tenant-id.decorator';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Productos')
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Post('upload')
  @RequirePermission('catalogo.crear')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }
    const base64Data = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64Data}`;
    return { url: dataUrl };
  }

  @Post()
  @RequirePermission('catalogo.crear')
  create(
    @TenantId() tenantId: string,
    @Body() dto: CreateProductoDto,
  ) {
    return this.productosService.create(tenantId, dto);
  }

  @Get()
  @RequirePermission('catalogo.ver')
  findAll(@TenantId() tenantId: string) {
    return this.productosService.findAll(tenantId);
  }

  @Put(':id')
  @RequirePermission('catalogo.editar')
  update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateDto: Partial<CreateProductoDto>,
  ) {
    return this.productosService.update(tenantId, id, updateDto);
  }

  @Delete(':id')
  @RequirePermission('catalogo.eliminar')
  remove(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.productosService.remove(tenantId, id);
  }
}
