import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('ventas')
@Index(['tenant_id'])
@Index(['tenant_id', 'sucursal_id'])
export class Venta {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  sucursal_id: string;

  @Column({ unique: true })
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
    subtotal: number;
  }>;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  total: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  costoTotal: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  utilidadTotal: number;

  @ManyToOne(() => Sucursal)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;
}
