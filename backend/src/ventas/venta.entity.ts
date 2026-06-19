import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Cliente } from '../clientes/cliente.entity';
import { User } from '../users/user.entity';
import { VentaDetalle } from './venta-detalle.entity';

@Entity('ventas')
@Index(['tenant_id'])
@Index(['tenant_id', 'sucursal_id'])
@Index(['tenant_id', 'numeroComprobante'], { unique: true })
export class Venta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  sucursal_id: string;

  @Column({ nullable: true })
  cliente_id: string;

  @Column({ nullable: true })
  vendedor_id: string;

  @Column()
  numeroComprobante: string;

  @Column()
  clienteNombre: string;

  @Column({ nullable: true })
  clienteDocumento: string;

  @CreateDateColumn()
  fecha: Date;

  @Column('jsonb')
  detalle: Array<{
    producto_id: string;
    sku: string;
    name: string;
    cantidad: number;
    precioUnitario: number;
    costoUnitario?: number;
    subtotal: number;
  }>;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  total: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  costoTotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  utilidadTotal: number;

  @Column({ default: 'Efectivo' })
  metodoPago: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  montoRecibido: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  cambio: number;

  @Column({ nullable: true })
  vendedorNombre: string;

  @ManyToOne(() => Sucursal)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @ManyToOne(() => Cliente, (cliente) => cliente.ventas, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'cliente_id' })
  cliente: Cliente;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'vendedor_id' })
  vendedor: User;

  @OneToMany(() => VentaDetalle, (detalle) => detalle.venta)
  detalles: VentaDetalle[];
}
