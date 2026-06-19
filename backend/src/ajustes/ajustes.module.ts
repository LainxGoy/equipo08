import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AjusteInventario } from './ajuste.entity';
import { AjustesService } from './ajustes.service';
import { AjustesController } from './ajustes.controller';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [TypeOrmModule.forFeature([AjusteInventario]), StockModule],
  controllers: [AjustesController],
  providers: [AjustesService],
  exports: [AjustesService],
})
export class AjustesModule {}
