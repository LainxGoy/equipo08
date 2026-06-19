import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { Producto } from '../productos/producto.entity';
import { User } from '../users/user.entity';

export enum MovimientoInventarioTipo {
  INGRESO = 'INGRESO',
  VENTA = 'VENTA',
  AJUSTE = 'AJUSTE',
  TRANSFERENCIA_SALIDA = 'TRANSFERENCIA_SALIDA',
  TRANSFERENCIA_ENTRADA = 'TRANSFERENCIA_ENTRADA',
  CORRECCION = 'CORRECCION',
}

@Entity('movimientos_inventario')
@Index(['tenant_id', 'sucursal_id', 'producto_id'])
@Index(['tenant_id', 'referencia_tipo', 'referencia_id'])
export class MovimientoInventario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  sucursal_id: string;

  @Column()
  producto_id: string;

  @Column({ nullable: true })
  usuario_id: string;

  @Column({
    type: 'enum',
    enum: MovimientoInventarioTipo,
  })
  tipo: MovimientoInventarioTipo;

  @Column('int')
  cantidad_delta: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0 })
  valor_delta: number;

  @Column('int', { nullable: true })
  stock_resultante: number;

  @Column('decimal', { precision: 12, scale: 2, nullable: true })
  valor_resultante: number;

  @Column({ nullable: true })
  referencia_tipo: string;

  @Column({ nullable: true })
  referencia_id: string;

  @Column('text', { nullable: true })
  observaciones: string;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Sucursal)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;

  @CreateDateColumn()
  fecha: Date;
}
