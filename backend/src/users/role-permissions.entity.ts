import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../tenant/tenant.entity';

@Entity('role_permissions')
@Index(['tenant_id', 'role'], { unique: true })
export class RolePermissions {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  tenant_id: string;

  @Column()
  role: string; // SUPERVISOR | VENDEDOR

  @Column({ default: true })
  sucursales_ver: boolean;
  @Column({ default: false })
  sucursales_crear: boolean;
  @Column({ default: false })
  sucursales_editar: boolean;
  @Column({ default: false })
  sucursales_eliminar: boolean;

  @Column({ default: true })
  catalogo_ver: boolean;
  @Column({ default: false })
  catalogo_crear: boolean;
  @Column({ default: false })
  catalogo_editar: boolean;
  @Column({ default: false })
  catalogo_eliminar: boolean;

  @Column({ default: true })
  proveedores_ver: boolean;
  @Column({ default: false })
  proveedores_crear: boolean;
  @Column({ default: false })
  proveedores_editar: boolean;
  @Column({ default: false })
  proveedores_eliminar: boolean;

  @Column({ default: true })
  sourcing_ver: boolean;
  @Column({ default: false })
  sourcing_crear: boolean;
  @Column({ default: false })
  sourcing_editar: boolean;
  @Column({ default: false })
  sourcing_eliminar: boolean;

  @Column({ default: true })
  inventario_ver: boolean;
  @Column({ default: false })
  inventario_crear: boolean;
  @Column({ default: false })
  inventario_editar: boolean;
  @Column({ default: false })
  inventario_eliminar: boolean;

  @Column({ default: true })
  usuarios_ver: boolean;
  @Column({ default: false })
  usuarios_crear: boolean;
  @Column({ default: false })
  usuarios_editar: boolean;
  @Column({ default: false })
  usuarios_eliminar: boolean;

  @Column({ default: true })
  ventas_ver: boolean;
  @Column({ default: true })
  ventas_crear: boolean;
  @Column({ default: false })
  ventas_editar: boolean;
  @Column({ default: false })
  ventas_eliminar: boolean;

  @ManyToOne(() => Tenant, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
