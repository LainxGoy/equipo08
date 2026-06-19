import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Venta } from './venta.entity';
import { VentaDetalle } from './venta-detalle.entity';
import { VentasController } from './ventas.controller';
import { TestVentasController } from './test-ventas.controller';
import { VentasService } from './ventas.service';
import { StockModule } from '../stock/stock.module';
import { Producto } from '../productos/producto.entity';
import { Cliente } from '../clientes/cliente.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta, VentaDetalle, Producto, Cliente]),
    StockModule,
  ],
  controllers: [VentasController, TestVentasController],
  providers: [VentasService],
  exports: [VentasService],
})
export class VentasModule {}
