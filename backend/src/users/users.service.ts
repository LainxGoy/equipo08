import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Permission } from './permission.entity';
import { RolePermissionAssignment } from './role-permission-assignment.entity';
import { Role } from './role.entity';
import { User, UserRole } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

const PERMISSION_KEYS = [
  'sucursales_ver',
  'sucursales_crear',
  'sucursales_editar',
  'sucursales_eliminar',
  'catalogo_ver',
  'catalogo_crear',
  'catalogo_editar',
  'catalogo_eliminar',
  'proveedores_ver',
  'proveedores_crear',
  'proveedores_editar',
  'proveedores_eliminar',
  'sourcing_ver',
  'sourcing_crear',
  'sourcing_editar',
  'sourcing_eliminar',
  'inventario_ver',
  'inventario_crear',
  'inventario_editar',
  'inventario_eliminar',
  'usuarios_ver',
  'usuarios_crear',
  'usuarios_editar',
  'usuarios_eliminar',
  'ventas_ver',
  'ventas_crear',
  'ventas_editar',
  'ventas_eliminar',
] as const;

type PermissionKey = (typeof PERMISSION_KEYS)[number];

type LegacyRolePermissions = {
  id: string;
  tenant_id: string;
  role: string;
} & Record<PermissionKey, boolean>;

const SUPERVISOR_DEFAULTS: Record<PermissionKey, boolean> = {
  sucursales_ver: true,
  sucursales_crear: false,
  sucursales_editar: false,
  sucursales_eliminar: false,
  catalogo_ver: true,
  catalogo_crear: true,
  catalogo_editar: true,
  catalogo_eliminar: false,
  proveedores_ver: true,
  proveedores_crear: true,
  proveedores_editar: true,
  proveedores_eliminar: false,
  sourcing_ver: true,
  sourcing_crear: true,
  sourcing_editar: true,
  sourcing_eliminar: false,
  inventario_ver: true,
  inventario_crear: true,
  inventario_editar: true,
  inventario_eliminar: false,
  usuarios_ver: true,
  usuarios_crear: false,
  usuarios_editar: false,
  usuarios_eliminar: false,
  ventas_ver: true,
  ventas_crear: true,
  ventas_editar: true,
  ventas_eliminar: false,
};

const VENDEDOR_DEFAULTS: Record<PermissionKey, boolean> = {
  sucursales_ver: true,
  sucursales_crear: false,
  sucursales_editar: false,
  sucursales_eliminar: false,
  catalogo_ver: true,
  catalogo_crear: false,
  catalogo_editar: false,
  catalogo_eliminar: false,
  proveedores_ver: true,
  proveedores_crear: false,
  proveedores_editar: false,
  proveedores_eliminar: false,
  sourcing_ver: true,
  sourcing_crear: false,
  sourcing_editar: false,
  sourcing_eliminar: false,
  inventario_ver: true,
  inventario_crear: false,
  inventario_editar: false,
  inventario_eliminar: false,
  usuarios_ver: false,
  usuarios_crear: false,
  usuarios_editar: false,
  usuarios_eliminar: false,
  ventas_ver: true,
  ventas_crear: true,
  ventas_editar: false,
  ventas_eliminar: false,
};

const DEFAULT_ROLE_PERMISSIONS: Record<
  string,
  Record<PermissionKey, boolean>
> = {
  [UserRole.SUPERVISOR]: SUPERVISOR_DEFAULTS,
  [UserRole.VENDEDOR]: VENDEDOR_DEFAULTS,
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRep: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRep: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRep: Repository<Permission>,
    @InjectRepository(RolePermissionAssignment)
    private readonly rolePermissionRep: Repository<RolePermissionAssignment>,
  ) {}

  async create(tenant_id: string, dto: CreateUserDto): Promise<User> {
    const existing = await this.userRep.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException(
        'El correo electronico ya esta registrado.',
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);
    const roleRecord = dto.role
      ? await this.ensureRole(tenant_id, dto.role)
      : null;

    const newUser = this.userRep.create({
      ...dto,
      password: hashedPassword,
      tenant_id,
      role_id: roleRecord?.id,
    });

    return this.userRep.save(newUser);
  }

  async findAll(tenant_id: string): Promise<User[]> {
    return this.userRep.find({
      where: { tenant_id },
      relations: ['sucursal'],
      select: [
        'id',
        'name',
        'email',
        'role',
        'role_id',
        'isActive',
        'createdAt',
        'sucursal_id',
      ],
    });
  }

  async findOne(tenant_id: string, id: string): Promise<User> {
    const user = await this.userRep.findOne({ where: { id, tenant_id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async remove(tenant_id: string, id: string): Promise<void> {
    const user = await this.findOne(tenant_id, id);
    if (user.role === UserRole.OWNER) {
      throw new BadRequestException(
        'No se puede eliminar al dueno de la tienda.',
      );
    }
    await this.userRep.remove(user);
  }

  async update(
    tenant_id: string,
    id: string,
    dto: Partial<CreateUserDto>,
    requesterId?: string,
  ): Promise<User> {
    const user = await this.findOne(tenant_id, id);

    // Proteccion: No se puede cambiar el rol del Owner original
    if (
      user.role === UserRole.OWNER &&
      dto.role &&
      dto.role !== UserRole.OWNER
    ) {
      throw new BadRequestException(
        'No se puede degradar el perfil del Dueno de la tienda.',
      );
    }

    // Proteccion: No se puede desactivar al Owner original
    if (user.role === UserRole.OWNER && dto.isActive === false) {
      throw new BadRequestException(
        'No se puede desactivar la cuenta del Administrador principal (Dueno).',
      );
    }

    // Proteccion: Un usuario no puede desactivar su propia cuenta
    if (id === requesterId && dto.isActive === false) {
      throw new BadRequestException(
        'No puedes desactivar tu propia cuenta de acceso.',
      );
    }

    if (dto.password && dto.password.trim() !== '') {
      const salt = await bcrypt.genSalt();
      dto.password = await bcrypt.hash(dto.password, salt);
    } else {
      delete dto.password;
    }

    if (dto.role) {
      const roleRecord = await this.ensureRole(tenant_id, dto.role);
      user.role_id = roleRecord.id;
    }

    Object.assign(user, dto);
    return this.userRep.save(user);
  }

  // --- Permissions Logic ---

  async getPermissions(tenant_id: string): Promise<LegacyRolePermissions[]> {
    await this.seedDefaultPermissions(tenant_id);

    const roles = await this.roleRep.find({
      where: { tenant_id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
      order: { name: 'ASC' },
    });

    return roles.map((role) => this.toLegacyPermissions(role));
  }

  async updatePermissions(
    tenant_id: string,
    dto: UpdatePermissionsDto,
  ): Promise<LegacyRolePermissions> {
    const permissions = await this.ensurePermissionCatalog();
    const role = await this.ensureRole(tenant_id, dto.role);
    const updates: Partial<Record<PermissionKey, boolean>> = {};
    const incoming = dto as unknown as Record<string, unknown>;

    for (const key of PERMISSION_KEYS) {
      if (typeof incoming[key] === 'boolean') {
        updates[key] = incoming[key] as boolean;
      }
    }

    await this.applyRolePermissions(
      role,
      permissions,
      updates,
      undefined,
      true,
    );

    const updatedRole = await this.roleRep.findOne({
      where: { id: role.id },
      relations: ['rolePermissions', 'rolePermissions.permission'],
    });

    return this.toLegacyPermissions(updatedRole ?? role);
  }

  async seedDefaultPermissions(
    tenant_id: string,
    manager?: EntityManager,
  ): Promise<void> {
    const permissions = await this.ensurePermissionCatalog(manager);

    for (const [roleName, defaults] of Object.entries(
      DEFAULT_ROLE_PERMISSIONS,
    )) {
      const role = await this.ensureRole(tenant_id, roleName, manager);
      await this.applyRolePermissions(
        role,
        permissions,
        defaults,
        manager,
        false,
      );
    }
  }

  private getRoleRepository(manager?: EntityManager): Repository<Role> {
    return manager ? manager.getRepository(Role) : this.roleRep;
  }

  private getPermissionRepository(
    manager?: EntityManager,
  ): Repository<Permission> {
    return manager ? manager.getRepository(Permission) : this.permissionRep;
  }

  private getRolePermissionRepository(
    manager?: EntityManager,
  ): Repository<RolePermissionAssignment> {
    return manager
      ? manager.getRepository(RolePermissionAssignment)
      : this.rolePermissionRep;
  }

  private async ensurePermissionCatalog(
    manager?: EntityManager,
  ): Promise<Map<PermissionKey, Permission>> {
    const permissionRep = this.getPermissionRepository(manager);
    const existingPermissions = await permissionRep.find({
      where: { key: In([...PERMISSION_KEYS]) },
    });
    const existingKeys = new Set(
      existingPermissions.map((permission) => permission.key),
    );
    const missingPermissions = PERMISSION_KEYS.filter(
      (key) => !existingKeys.has(key),
    ).map((key) => {
      const [module, action] = key.split('_');
      return permissionRep.create({ key, module, action });
    });

    if (missingPermissions.length > 0) {
      await permissionRep.save(missingPermissions);
    }

    const permissions = await permissionRep.find({
      where: { key: In([...PERMISSION_KEYS]) },
    });

    return new Map(
      permissions.map((permission) => [
        permission.key as PermissionKey,
        permission,
      ]),
    );
  }

  private async ensureRole(
    tenant_id: string,
    name: string,
    manager?: EntityManager,
  ): Promise<Role> {
    const roleRep = this.getRoleRepository(manager);
    let role = await roleRep.findOne({ where: { tenant_id, name } });

    if (!role) {
      role = roleRep.create({
        tenant_id,
        name,
        isSystem: name === UserRole.SUPERVISOR || name === UserRole.VENDEDOR,
      });
      role = await roleRep.save(role);
    }

    return role;
  }

  private async applyRolePermissions(
    role: Role,
    permissions: Map<PermissionKey, Permission>,
    values: Partial<Record<PermissionKey, boolean>>,
    manager?: EntityManager,
    overwriteExisting = true,
  ): Promise<void> {
    const rolePermissionRep = this.getRolePermissionRepository(manager);
    const existingAssignments = await rolePermissionRep.find({
      where: { role_id: role.id },
      relations: ['permission'],
    });
    const existingByKey = new Map(
      existingAssignments
        .filter((assignment) => assignment.permission)
        .map((assignment) => [assignment.permission.key, assignment]),
    );
    const assignmentsToSave: RolePermissionAssignment[] = [];

    for (const key of PERMISSION_KEYS) {
      if (!(key in values)) continue;

      const permission = permissions.get(key);
      if (!permission) continue;

      const enabled = values[key] === true;
      const existing = existingByKey.get(key);

      if (existing) {
        if (overwriteExisting && existing.enabled !== enabled) {
          existing.enabled = enabled;
          assignmentsToSave.push(existing);
        }
        continue;
      }

      assignmentsToSave.push(
        rolePermissionRep.create({
          role_id: role.id,
          permission_id: permission.id,
          enabled,
        }),
      );
    }

    if (assignmentsToSave.length > 0) {
      await rolePermissionRep.save(assignmentsToSave);
    }
  }

  private toLegacyPermissions(role: Role): LegacyRolePermissions {
    const legacy = {
      id: role.id,
      tenant_id: role.tenant_id,
      role: role.name,
    } as LegacyRolePermissions;

    for (const key of PERMISSION_KEYS) {
      legacy[key] = false;
    }

    for (const assignment of role.rolePermissions ?? []) {
      const key = assignment.permission?.key;
      if (key && (PERMISSION_KEYS as readonly string[]).includes(key)) {
        legacy[key as PermissionKey] = assignment.enabled;
      }
    }

    return legacy;
  }
}
