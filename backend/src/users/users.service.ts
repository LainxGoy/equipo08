import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
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

export type LegacyRolePermissions = {
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

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRep: Repository<User>,
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

    const { password, ...userData } = dto;
    const newUser = this.userRep.create({
      ...userData,
      passwordHash: hashedPassword,
      tenant_id,
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

    const { password, ...updateData } = dto;
    Object.assign(user, updateData);

    if (password && password.trim() !== '') {
      const salt = await bcrypt.genSalt();
      user.passwordHash = await bcrypt.hash(password, salt);
    }

    return this.userRep.save(user);
  }

  // --- Static Permissions Logic ---

  async getPermissions(tenant_id: string): Promise<LegacyRolePermissions[]> {
    return [
      {
        id: 'supervisor-static',
        tenant_id,
        role: UserRole.SUPERVISOR,
        ...SUPERVISOR_DEFAULTS,
      },
      {
        id: 'vendedor-static',
        tenant_id,
        role: UserRole.VENDEDOR,
        ...VENDEDOR_DEFAULTS,
      },
    ];
  }

  async updatePermissions(
    tenant_id: string,
    dto: UpdatePermissionsDto,
  ): Promise<LegacyRolePermissions> {
    // Los permisos son estaticos y no editables en BD, retornamos el default correspondiente
    const defaults =
      dto.role === UserRole.SUPERVISOR ? SUPERVISOR_DEFAULTS : VENDEDOR_DEFAULTS;
    return {
      id: `${dto.role.toLowerCase()}-static`,
      tenant_id,
      role: dto.role,
      ...defaults,
    };
  }

  async seedDefaultPermissions(tenant_id: string, manager?: any): Promise<void> {
    // No-op ya que no usamos BDD para permisos
  }
}
