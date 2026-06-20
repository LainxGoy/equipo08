import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RolePermissionAssignment } from './role-permission-assignment.entity';

@Entity('permissions')
@Index(['key'], { unique: true })
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  key: string;

  @Column()
  module: string;

  @Column()
  action: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(
    () => RolePermissionAssignment,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermissionAssignment[];
}
