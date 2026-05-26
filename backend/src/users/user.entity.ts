import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';
import { Sucursal } from '../sucursales/sucursal.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  SUPERVISOR = 'SUPERVISOR',
  VENDEDOR = 'VENDEDOR',
}

@Entity('users')
@Index(['tenant_id', 'email'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenant_id: string;

  @Column({ nullable: true })
  sucursal_id: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VENDEDOR,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @ManyToOne(() => Sucursal, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'sucursal_id' })
  sucursal: Sucursal;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
