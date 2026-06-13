import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum TenantStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  domain: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.PENDING,
  })
  status: TenantStatus;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  ubicacion: string;

  @Column({ nullable: true })
  nit: string;

  @Column({ nullable: true })
  razonSocial: string;

  @Column({ type: 'text', nullable: true })
  logoUrl: string;

  @Column({ type: 'text', nullable: true })
  bannerUrl: string;

  @Column({ nullable: true })
  brandColor: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
