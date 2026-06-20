import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permission } from './permission.entity';
import { Role } from './role.entity';

@Entity('role_permission_assignments')
@Index(['role_id', 'permission_id'], { unique: true })
export class RolePermissionAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  role_id: string;

  @Column('uuid')
  permission_id: string;

  @Column({ default: false })
  enabled: boolean;

  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission;
}
