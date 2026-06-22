import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Producto } from '../productos/producto.entity';
import { User } from '../users/user.entity';
import { Stock } from '../stock/stock.entity';

export enum MotivoAjuste {
  ROBO_O_PERDIDA = 'ROBO_O_PERDIDA',
  DANO_MERMA = 'DANO_MERMA',
  ERROR_REGISTRO = 'ERROR_REGISTRO',
  CADUCIDAD = 'CADUCIDAD',
}

@Entity('ajustes_inventario')
export class AjusteInventario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenant_id: string;

  @Column()
  sucursal_id: string;

  @Column()
  producto_id: string;

  @Column()
  usuario_id: string;

  @Column({ nullable: true })
  stock_id: string;

  @Column('int')
  cantidad_sistema: number;

  @Column('int')
  cantidad_fisica: number;

  @Column({
    type: 'enum',
    enum: MotivoAjuste,
    nullable: false,
  })
  motivo: MotivoAjuste;

  @Column('text', { nullable: true })
  observaciones: string;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  valor_perdido: number;

  @CreateDateColumn()
  fecha: Date;


  @ManyToOne(() => Stock, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @ManyToOne(() => Sucursal, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @ManyToOne(() => Producto, { onDelete: 'CASCADE', createForeignKeyConstraints: false })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}
