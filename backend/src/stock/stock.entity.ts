import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Producto } from '../productos/producto.entity';
import { Sucursal } from '../sucursales/sucursal.entity';
import { ProductoVariacion } from '../productos/producto-variacion.entity';

@Entity('stock')
@Index(['tenant_id', 'sucursal_id', 'producto_id'], { unique: true })
@Index(['tenant_id', 'sucursal_id', 'producto_variacion_id'], { unique: true })
@Check('cantidad_actual >= 0')
@Check('costo_promedio >= 0')
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ nullable: true })
  sucursal_id: string;

  @Column()
  producto_id: string;

  @Column({ name: 'producto_variacion_id', type: 'uuid', nullable: true })
  producto_variacion_id: string;

  @Column('int', { name: 'cantidad_actual', default: 0 })
  cantidadActual: number;

  @Column('decimal', { name: 'costo_promedio', precision: 12, scale: 2, default: 0 })
  costoPromedio: number;

  @UpdateDateColumn({ name: 'ultima_actualizacion' })
  ultimaActualizacion: Date;

  @ManyToOne(() => Producto, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Sucursal, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @ManyToOne(() => ProductoVariacion, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'producto_variacion_id' })
  variacion: ProductoVariacion;
}
