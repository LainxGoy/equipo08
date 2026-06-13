import { Controller, Post, Get, Body, Param, UseGuards, Res } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { CreateVentaDto } from './dto/create-venta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/tenant-id.decorator';
import { RequirePermission } from '../auth/decorators/permissions.decorator';
import type { Response } from 'express';
import * as fs from 'fs';

@UseGuards(JwtAuthGuard)
@Controller('ventas')
export class VentasController {
  constructor(private readonly ventasService: VentasService) {}

  @Post()
  @RequirePermission('ventas.crear')
  async create(@Body() createVentaDto: CreateVentaDto, @TenantId() tenant_id: string) {
    return this.ventasService.create(createVentaDto, tenant_id);
  }

  @Get()
  @RequirePermission('ventas.ver')
  async findAll(@TenantId() tenant_id: string) {
    return this.ventasService.findAll(tenant_id);
  }

  @Get('kpis/dashboard')
  @RequirePermission('ventas.ver')
  async getKpis(@TenantId() tenant_id: string) {
    return this.ventasService.getDashboardKpis(tenant_id);
  }

  @Get('siguiente-numero/:sucursalId')
  @RequirePermission('ventas.crear')
  async getSiguienteNumero(@TenantId() tenant_id: string, @Param('sucursalId') sucursalId: string) {
    const nextNumber = await this.ventasService.getSiguienteNumero(tenant_id, sucursalId);
    return { nextNumber };
  }

  @Get('cliente/:doc')
  @RequirePermission('ventas.crear')
  async findClientByDocument(@Param('doc') doc: string, @TenantId() tenant_id: string) {
    const client = await this.ventasService.findClientByDocument(doc, tenant_id);
    return client || { clienteNombre: '' };
  }

  @Get(':id')
  @RequirePermission('ventas.ver')
  async findOne(@Param('id') id: string, @TenantId() tenant_id: string) {
    return this.ventasService.findOne(id, tenant_id);
  }

  @Get(':id/pdf')
  @RequirePermission('ventas.ver')
  async downloadPdf(@Param('id') id: string, @TenantId() tenant_id: string, @Res() res: Response) {
    const pdfPath = await this.ventasService.getPdfPath(id, tenant_id);
    const venta = await this.ventasService.findOne(id, tenant_id);
    
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${venta.numeroComprobante}.pdf"`,
    });
    
    const fileStream = fs.createReadStream(pdfPath);
    fileStream.pipe(res);
  }
}
