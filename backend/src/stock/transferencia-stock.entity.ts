import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Producto } from '../productos/producto.entity';
import { User } from '../users/user.entity';
import { Stock } from './stock.entity';

export enum TransferenciaStockEstado {
  COMPLETADA = 'COMPLETADA',
  ANULADA = 'ANULADA',
}

@Entity('transferencias_stock')
@Index(['tenant_id', 'from_sucursal_id'])
@Index(['tenant_id', 'to_sucursal_id'])
@Index(['tenant_id', 'producto_id'])
@Index(['from_stock_id'])
@Index(['to_stock_id'])
export class TransferenciaStock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenant_id: string;

  @Column()
  from_sucursal_id: string;

  @Column()
  to_sucursal_id: string;

  @Column()
  producto_id: string;

  @Column({ nullable: true })
  usuario_id: string;

  @Column({ nullable: true })
  from_stock_id: string;

  @Column({ nullable: true })
  to_stock_id: string;

  @Column('int')
  cantidad: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  valorTransferido: number;

  @Column({
    type: 'enum',
    enum: TransferenciaStockEstado,
    default: TransferenciaStockEstado.COMPLETADA,
  })
  estado: TransferenciaStockEstado;


  @ManyToOne(() => Stock, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'from_stock_id' })
  stockOrigen: Stock;

  @ManyToOne(() => Stock, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'to_stock_id' })
  stockDestino: Stock;

  @ManyToOne(() => Sucursal, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'from_sucursal_id' })
  sucursalOrigen: Sucursal;

  @ManyToOne(() => Sucursal, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'to_sucursal_id' })
  sucursalDestino: Sucursal;

  @ManyToOne(() => Producto, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => User, { nullable: true, createForeignKeyConstraints: false })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @CreateDateColumn()
  fecha: Date;
}
