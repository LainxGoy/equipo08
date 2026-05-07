import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Producto } from '../productos/producto.entity';
import { Proveedor } from '../proveedores/proveedor.entity';

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

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  costoUnitarioSnapshot: number;

  @Column({ type: 'date', nullable: true })
  fechaElaboracion: string;

  @Column({ type: 'date', nullable: true })
  fechaVencimiento: string;

  @CreateDateColumn()
  fechaIngreso: Date;

  @ManyToOne(() => Producto)
  @JoinColumn({ name: 'producto_id' })
  producto: Producto;

  @ManyToOne(() => Proveedor)
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;
}
