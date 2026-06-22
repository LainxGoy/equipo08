import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Proveedor } from '../proveedores/proveedor.entity';
import { Stock } from '../stock/stock.entity';

@Entity('productos')
@Index(['tenant_id', 'id'])
@Index(['tenant_id', 'sku'], { unique: true })
export class Producto {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  name: string;

  @Column()
  sku: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, any>;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'text', nullable: true })
  imagen_url: string;

  @Column('int', { name: 'stock_minimo', default: 10 })
  stockMinimo: number;

  @Column('decimal', { name: 'precio_costo', precision: 10, scale: 2, default: 0 })
  precioCosto: number;

  @Column('decimal', { name: 'precio_venta', precision: 10, scale: 2, default: 0 })
  precioVenta: number;

  @Column({ nullable: true })
  proveedor_id: string;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Stock, (stock) => stock.producto)
  stocks: Stock[];
}
