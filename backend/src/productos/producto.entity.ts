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
  Check,
} from 'typeorm';
import { Proveedor } from '../proveedores/proveedor.entity';
import { Stock } from '../stock/stock.entity';
import { Categoria } from './categoria.entity';

@Entity('productos')
@Index(['tenant_id', 'id'])
@Index(['tenant_id', 'sku'], { unique: true })
@Check('precio_venta >= 0')
@Check('precio_costo >= 0')
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

  @Column({ name: 'categoria_id', type: 'uuid', nullable: true })
  categoria_id: string;

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

  @ManyToOne(() => Proveedor, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @ManyToOne(() => Categoria, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Stock, (stock) => stock.producto)
  stocks: Stock[];
}
