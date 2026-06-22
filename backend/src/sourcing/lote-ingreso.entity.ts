import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  Check,
} from 'typeorm';
import { Stock } from '../stock/stock.entity';
import { User } from '../users/user.entity';

@Entity('lotes_ingreso')
@Index(['tenant_id', 'id'])
@Check('cantidad > 0')
@Check('costo_unitario >= 0')
export class LoteIngreso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenant_id: string;

  @Column()
  stock_id: string;

  @Column('int')
  cantidad: number;

  @Column('decimal', { name: 'costo_unitario', precision: 10, scale: 2, default: 0 })
  costoUnitario: number;

  @Column({ name: 'fecha_elaboracion', type: 'date', nullable: true })
  fechaElaboracion: string;

  @Column({ name: 'fecha_vencimiento', type: 'date', nullable: true })
  fechaVencimiento: string;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuario_id: string;

  @CreateDateColumn({ name: 'fecha_ingreso' })
  fechaIngreso: Date;

  @ManyToOne(() => Stock, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  @ManyToOne(() => User, { createForeignKeyConstraints: false, nullable: true })
  @JoinColumn({ name: 'usuario_id' })
  usuario: User;
}
