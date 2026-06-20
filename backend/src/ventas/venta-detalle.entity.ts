import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  AfterLoad,
} from 'typeorm';
import { Venta } from './venta.entity';
import { Producto } from '../productos/producto.entity';

@Entity('venta_detalles')
@Index(['tenant_id', 'venta_id'])
@Index(['tenant_id', 'producto_id'])
export class VentaDetalle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  venta_id: string;

  @Column()
  producto_id: string;

  @Column()
  skuSnapshot: string;

  @Column()
  nombreProductoSnapshot: string;

  @Column('int')
  cantidad: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  precioUnitarioSnapshot: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  costoUnitarioSnapshot: number;

  subtotal: number;

  costoSubtotal: number;

  utilidadSubtotal: number;

  @ManyToOne(() => Venta, (venta) => venta.detalles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'venta_id' })
  venta: Venta;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @CreateDateColumn()
  createdAt: Date;

  @AfterLoad()
  calculateSubtotals() {
    this.subtotal = Number(this.cantidad || 0) * Number(this.precioUnitarioSnapshot || 0);
    this.costoSubtotal = Number(this.cantidad || 0) * Number(this.costoUnitarioSnapshot || 0);
    this.utilidadSubtotal = Number(this.subtotal || 0) - Number(this.costoSubtotal || 0);
  }
}
