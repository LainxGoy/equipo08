import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SourcingService } from './sourcing.service';
import { SourcingController } from './sourcing.controller';
import { LoteIngreso } from './lote-ingreso.entity';
import { StockModule } from '../stock/stock.module';
import { AjusteInventario } from '../ajustes/ajuste.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([LoteIngreso, AjusteInventario]),
    StockModule,
  ],
  controllers: [SourcingController],
  providers: [SourcingService],
})
export class SourcingModule {}
