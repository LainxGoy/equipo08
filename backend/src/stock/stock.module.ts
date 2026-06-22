import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { Stock } from './stock.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';
import { Producto } from '../productos/producto.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Stock,
      Producto,
      MovimientoInventario,
    ]),
  ],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}
