import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Stock } from './stock.entity';

@Entity('movimientos_inventario')
@Index(['tenant_id', 'stock_id'])
export class MovimientoInventario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
  tenant_id: string;

  @Column({ name: 'stock_id' })
  stock_id: string;

  @Column({ type: 'varchar' })
  tipo: string; // INGRESO, EGRESO, AJUSTE, DEVOLUCION, ANULACION, TRANSFERENCIA

  @Column('int')
  cantidad: number;

  @Column('decimal', { precision: 10, scale: 2, name: 'costo_unitario', default: 0 })
  costoUnitario: number;

  @Column({ nullable: true })
  motivo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Stock, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;
}
