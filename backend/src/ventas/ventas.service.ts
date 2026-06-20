import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Venta } from './venta.entity';
import { VentaDetalle } from './venta-detalle.entity';
import { CreateVentaDto } from './dto/create-venta.dto';
import { StockService } from '../stock/stock.service';
import { Stock } from '../stock/stock.entity';
import { Producto } from '../productos/producto.entity';
import { Cliente } from '../clientes/cliente.entity';
import {
  MovimientoInventario,
  MovimientoInventarioTipo,
} from '../stock/movimiento-inventario.entity';
import PDFDocument = require('pdfkit');
import * as fs from 'fs';
import * as path from 'path';

type LegacyVentaItem = {
  producto_id: string;
  sku: string;
  name: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
  subtotal: number;
};

type ProcessedVentaItem = LegacyVentaItem & {
  stock_id?: string;
  costoSubtotal: number;
  utilidadSubtotal: number;
  stockResultante: number;
  valorResultante: number;
};

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private readonly ventaRep: Repository<Venta>,
    @InjectRepository(Producto)
    private readonly productoRep: Repository<Producto>,
    private readonly stockService: StockService,
    private readonly dataSource: DataSource,
  ) {
    const tempDir = path.join(process.cwd(), 'temp', 'comprobantes');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
  }

  async getSiguienteNumero(
    tenant_id: string,
    sucursalId: string,
  ): Promise<string> {
    const count = await this.ventaRep.count({
      where: { tenant_id, sucursal_id: sucursalId },
    });
    return (count + 1).toString().padStart(6, '0');
  }

  async create(
    dto: CreateVentaDto,
    tenant_id: string,
    vendedor_id?: string,
  ): Promise<Venta> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const detalle: ProcessedVentaItem[] = [];
      let total = 0;
      let costoTotal = 0;

      for (const item of dto.items) {
        const producto = await queryRunner.manager.findOne(Producto, {
          where: { id: item.producto_id, tenant_id },
        });
        if (!producto)
          throw new NotFoundException(
            `Producto ${item.producto_id} no encontrado`,
          );

        const stock = await queryRunner.manager.findOne(Stock, {
          where: {
            tenant_id,
            sucursal_id: dto.sucursal_id,
            producto_id: producto.id,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (!stock || stock.cantidadTotal < item.cantidad) {
          throw new BadRequestException(
            `Stock insuficiente para ${producto.name}. Disponible: ${stock ? stock.cantidadTotal : 0}`,
          );
        }

        const precioUnitario = Number(producto.precioVenta);
        const costoUnitario = Number(producto.precioCosto);
        const subtotal = precioUnitario * item.cantidad;
        const costoSubtotal = costoUnitario * item.cantidad;
        const utilidadSubtotal = subtotal - costoSubtotal;

        total += subtotal;
        costoTotal += costoSubtotal;

        stock.cantidadTotal = Number(stock.cantidadTotal) - item.cantidad;
        stock.valorAdquisicion = Number(stock.valorAdquisicion) - costoSubtotal;
        await queryRunner.manager.save(Stock, stock);

        detalle.push({
          producto_id: producto.id,
          sku: producto.sku,
          name: producto.name,
          cantidad: item.cantidad,
          precioUnitario,
          costoUnitario,
          stock_id: stock.id,
          subtotal,
          costoSubtotal,
          utilidadSubtotal,
          stockResultante: stock.cantidadTotal,
          valorResultante: Number(stock.valorAdquisicion),
        });
      }

      const cliente = await this.findOrCreateCliente(
        queryRunner.manager,
        tenant_id,
        dto.clienteNombre,
        dto.clienteDocumento,
      );

      const count = await queryRunner.manager.count(Venta, {
        where: { tenant_id, sucursal_id: dto.sucursal_id },
      });
      const nextNum = (count + 1).toString().padStart(6, '0');
      const numeroComprobante = `FAC-${nextNum}`;
      const utilidadTotal = total - costoTotal;

      const venta = queryRunner.manager.create(Venta, {
        tenant_id,
        sucursal_id: dto.sucursal_id,
        cliente_id: cliente?.id,
        vendedor_id,
        numeroComprobante,
        clienteNombre: dto.clienteNombre,
        clienteDocumento: dto.clienteDocumento,
        detalle,
        total,
        costoTotal,
        utilidadTotal,
        metodoPago: dto.metodoPago || 'Efectivo',
        montoRecibido: dto.montoRecibido || total,
        cambio: dto.cambio || 0,
        vendedorNombre: dto.vendedorNombre || 'Sistema',
      });

      const savedVenta = await queryRunner.manager.save(Venta, venta);
      const savedDetalles: VentaDetalle[] = [];

      for (const item of detalle) {
        const ventaDetalle = queryRunner.manager.create(VentaDetalle, {
          tenant_id,
          venta_id: savedVenta.id,
          producto_id: item.producto_id,
          skuSnapshot: item.sku,
          nombreProductoSnapshot: item.name,
          cantidad: item.cantidad,
          precioUnitarioSnapshot: item.precioUnitario,
          costoUnitarioSnapshot: item.costoUnitario,
          subtotal: item.subtotal,
          costoSubtotal: item.costoSubtotal,
          utilidadSubtotal: item.utilidadSubtotal,
        });
        const savedDetalle = await queryRunner.manager.save(
          VentaDetalle,
          ventaDetalle,
        );
        savedDetalles.push(savedDetalle);

        const movimiento = queryRunner.manager.create(MovimientoInventario, {
          tenant_id,
          sucursal_id: dto.sucursal_id,
          producto_id: item.producto_id,
          stock_id: item.stock_id,
          usuario_id: vendedor_id,
          tipo: MovimientoInventarioTipo.VENTA,
          cantidad_delta: -item.cantidad,
          valor_delta: -item.costoSubtotal,
          stock_resultante: item.stockResultante,
          valor_resultante: item.valorResultante,
          referencia_tipo: 'VENTA_DETALLE',
          referencia_id: savedDetalle.id,
          observaciones: numeroComprobante,
        });
        await queryRunner.manager.save(MovimientoInventario, movimiento);
      }

      await queryRunner.commitTransaction();

      savedVenta.detalles = savedDetalles;
      if (cliente) savedVenta.cliente = cliente;
      this.hydrateLegacyDetalle(savedVenta);

      this.generatePdf(savedVenta.id, tenant_id).catch((err) =>
        console.error('Error al generar PDF', err),
      );

      return savedVenta;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(tenant_id: string): Promise<Venta[]> {
    const ventas = await this.ventaRep.find({
      where: { tenant_id },
      order: { fecha: 'DESC' },
      relations: ['sucursal', 'cliente', 'detalles'],
    });
    return ventas.map((venta) => this.hydrateLegacyDetalle(venta));
  }

  async findOne(id: string, tenant_id: string): Promise<Venta> {
    const venta = await this.ventaRep.findOne({
      where: { id, tenant_id },
      relations: ['sucursal', 'cliente', 'detalles'],
    });
    if (!venta) throw new NotFoundException('Venta no encontrada');
    return this.hydrateLegacyDetalle(venta);
  }

  async getDashboardKpis(tenant_id: string): Promise<any> {
    const kpis = await this.ventaRep
      .createQueryBuilder('venta')
      .where('venta.tenant_id = :tenant_id', { tenant_id })
      .select('SUM(venta.total)', 'sumTotal')
      .addSelect('SUM(venta.costoTotal)', 'sumCosto')
      .addSelect('SUM(venta.utilidadTotal)', 'sumUtilidad')
      .addSelect('COUNT(venta.id)', 'countVentas')
      .getRawOne();

    const recentSales = await this.ventaRep.find({
      where: { tenant_id },
      order: { fecha: 'DESC' },
      take: 5,
      relations: ['cliente', 'detalles'],
    });

    return {
      totalVentas: Number(kpis.countVentas || 0),
      ingresosTotales: Number(kpis.sumTotal || 0),
      costoTotal: Number(kpis.sumCosto || 0),
      utilidadTotal: Number(kpis.sumUtilidad || 0),
      recentSales: recentSales.map((venta) => this.hydrateLegacyDetalle(venta)),
    };
  }

  async generatePdf(id: string, tenant_id: string): Promise<string> {
    const venta = await this.findOne(id, tenant_id);
    const pdfPath = path.join(
      process.cwd(),
      'temp',
      'comprobantes',
      `${venta.id}.pdf`,
    );

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      doc
        .fontSize(20)
        .fillColor('#10b981')
        .text('COMPROBANTE DE VENTA', { align: 'center' });
      doc.moveDown();

      doc.fontSize(10).fillColor('#4b5563');
      doc.text(`Comprobante Nro: ${venta.numeroComprobante}`);
      doc.text(`Fecha: ${new Date(venta.fecha).toLocaleString()}`);
      doc.text(`Cajero/Vendedor: ${venta.vendedorNombre || 'Sistema'}`);
      doc.text(
        `Sucursal: ${venta.sucursal ? venta.sucursal.name : 'Principal'}`,
      );
      doc.moveDown();

      doc.fontSize(12).fillColor('#111827').text('Datos del Cliente');
      doc.fontSize(10).fillColor('#4b5563');
      doc.text(`Nombre/Razon Social: ${venta.clienteNombre}`);
      if (venta.clienteDocumento) doc.text(`NIT/CI: ${venta.clienteDocumento}`);
      doc.moveDown();

      const tableTop = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Cant.', 50, tableTop);
      doc.text('Descripcion', 100, tableTop);
      doc.text('P. Unit (Bs)', 350, tableTop, { width: 90, align: 'right' });
      doc.text('Subtotal (Bs)', 450, tableTop, { width: 90, align: 'right' });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(540, tableTop + 15)
        .strokeColor('#d1d5db')
        .stroke();

      doc.font('Helvetica');
      let currentY = tableTop + 25;

      venta.detalle.forEach((item) => {
        doc.text(item.cantidad.toString(), 50, currentY);
        doc.text(`${item.name}`, 100, currentY, { width: 240 });
        doc.text(Number(item.precioUnitario).toFixed(2), 350, currentY, {
          width: 90,
          align: 'right',
        });
        doc.text(Number(item.subtotal).toFixed(2), 450, currentY, {
          width: 90,
          align: 'right',
        });
        currentY += 20;
      });

      doc.moveTo(50, currentY).lineTo(540, currentY).stroke();
      currentY += 10;

      doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827');
      doc.text('TOTAL:', 350, currentY, { width: 90, align: 'right' });
      doc
        .fillColor('#10b981')
        .text(`Bs. ${Number(venta.total).toFixed(2)}`, 450, currentY, {
          width: 90,
          align: 'right',
        });

      currentY += 25;
      doc.font('Helvetica').fontSize(10).fillColor('#4b5563');
      doc.text(
        `Metodo de Pago: ${venta.metodoPago || 'Efectivo'}`,
        300,
        currentY,
        { width: 240, align: 'right' },
      );
      currentY += 15;
      doc.text(
        `Monto Recibido: Bs. ${Number(venta.montoRecibido || 0).toFixed(2)}`,
        300,
        currentY,
        { width: 240, align: 'right' },
      );
      currentY += 15;
      doc.text(
        `Cambio / Vuelto: Bs. ${Number(venta.cambio || 0).toFixed(2)}`,
        300,
        currentY,
        { width: 240, align: 'right' },
      );

      doc.moveDown(3);
      doc
        .fontSize(10)
        .fillColor('#6b7280')
        .text('Gracias por su compra!', { align: 'center' });
      doc.text('Este documento es una representacion digital de la venta.', {
        align: 'center',
      });

      doc.end();

      writeStream.on('finish', () => resolve(pdfPath));
      writeStream.on('error', reject);
    });
  }

  async getPdfPath(id: string, tenant_id: string): Promise<string> {
    const pdfPath = path.join(
      process.cwd(),
      'temp',
      'comprobantes',
      `${id}.pdf`,
    );
    if (!fs.existsSync(pdfPath)) {
      await this.generatePdf(id, tenant_id);
    }
    return pdfPath;
  }

  async findClientByDocument(
    documento: string,
    tenant_id: string,
  ): Promise<any> {
    const normalizedDocumento = documento.trim();
    const cliente = await this.dataSource.getRepository(Cliente).findOne({
      where: { tenant_id, documento: normalizedDocumento },
    });
    if (cliente) return { clienteNombre: cliente.nombre };

    const venta = await this.ventaRep.findOne({
      where: { tenant_id, clienteDocumento: normalizedDocumento },
      order: { fecha: 'DESC' },
    });
    if (!venta) return null;

    return { clienteNombre: venta.clienteNombre };
  }

  private async findOrCreateCliente(
    manager: EntityManager,
    tenant_id: string,
    clienteNombre: string,
    clienteDocumento?: string,
  ): Promise<Cliente | null> {
    const documento = clienteDocumento?.trim();
    if (!documento) return null;

    const nombre = clienteNombre?.trim() || 'Cliente Casual';
    let cliente = await manager.findOne(Cliente, {
      where: { tenant_id, documento },
    });

    if (cliente) {
      if (cliente.nombre !== nombre) {
        cliente.nombre = nombre;
        cliente = await manager.save(Cliente, cliente);
      }
      return cliente;
    }

    const nuevoCliente = manager.create(Cliente, {
      tenant_id,
      nombre,
      documento,
    });
    return manager.save(Cliente, nuevoCliente);
  }

  private hydrateLegacyDetalle(venta: Venta): Venta {
    if (venta.detalles?.length) {
      venta.detalle = venta.detalles.map((detalle) => ({
        producto_id: detalle.producto_id,
        sku: detalle.skuSnapshot,
        name: detalle.nombreProductoSnapshot,
        cantidad: Number(detalle.cantidad),
        precioUnitario: Number(detalle.precioUnitarioSnapshot),
        costoUnitario: Number(detalle.costoUnitarioSnapshot),
        subtotal: Number(detalle.subtotal),
      }));
    } else {
      venta.detalle = venta.detalle || [];
    }

    if (venta.cliente) {
      venta.clienteNombre = venta.cliente.nombre || venta.clienteNombre;
      venta.clienteDocumento =
        venta.cliente.documento || venta.clienteDocumento;
    }

    return venta;
  }
}
