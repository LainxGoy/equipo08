import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Producto } from '../productos/producto.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('stock')
@Index(['tenant_id', 'sucursal_id', 'producto_id'], { unique: true })
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ nullable: true })
  sucursal_id: string;

  @Column()
  producto_id: string;

  @Column('int', { default: 0 })
  cantidadTotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  valorAdquisicion: number;

  @UpdateDateColumn()
  ultimaActualizacion: Date;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Sucursal)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;
}
