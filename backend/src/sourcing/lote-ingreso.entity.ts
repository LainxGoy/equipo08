import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Producto } from '../productos/producto.entity';
import { Proveedor } from '../proveedores/proveedor.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

@Entity('lotes_ingreso')
@Index(['tenant_id', 'id'])
export class LoteIngreso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column({ nullable: true })
  sucursal_id: string;

  @Column()
  producto_id: string;

  @Column()
  proveedor_id: string;

  @Column('int')
  cantidad: number;

  @Column('decimal', { name: 'costo_unitario_snapshot', precision: 10, scale: 2, default: 0 })
  costoUnitarioSnapshot: number;

  @Column({ name: 'fecha_elaboracion', type: 'date', nullable: true })
  fechaElaboracion: string;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento: string;

  @CreateDateColumn({ name: 'fecha_ingreso' })
  fechaIngreso: Date;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @ManyToOne(() => Sucursal)
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;
}
