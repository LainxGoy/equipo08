import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { RolePermissions } from './role-permissions.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdatePermissionsDto } from './dto/update-permissions.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRep: Repository<User>,
    @InjectRepository(RolePermissions)
    private readonly permissionsRep: Repository<RolePermissions>,
  ) {}

  async create(tenant_id: string, dto: CreateUserDto): Promise<User> {
    const existing = await this.userRep.findOne({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException(
        'El correo electrónico ya está registrado.',
      );
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(dto.password, salt);

    const newUser = this.userRep.create({
      ...dto,
      password: hashedPassword,
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
        'No se puede eliminar al dueño de la tienda.',
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
        'No se puede degradar el perfil del Dueño de la tienda.',
      );
    }

    // Proteccion: No se puede desactivar al Owner original
    if (user.role === UserRole.OWNER && dto.isActive === false) {
      throw new BadRequestException(
        'No se puede desactivar la cuenta del Administrador principal (Dueño).',
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
      delete dto.password; // Evitar sobreescribir con vacio/null
    }

    Object.assign(user, dto);
    return this.userRep.save(user);
  }

  // --- Permissions Logic ---

  async getPermissions(tenant_id: string): Promise<RolePermissions[]> {
    return this.permissionsRep.find({ where: { tenant_id } });
  }

  async updatePermissions(
    tenant_id: string,
    dto: UpdatePermissionsDto,
  ): Promise<RolePermissions> {
    let perm = await this.permissionsRep.findOne({
      where: { tenant_id, role: dto.role },
    });
    if (!perm) {
      perm = this.permissionsRep.create({ tenant_id, role: dto.role });
    }
    Object.assign(perm, dto);
    return this.permissionsRep.save(perm);
  }

  async seedDefaultPermissions(
    tenant_id: string,
    manager?: EntityManager,
  ): Promise<void> {
    const supervisor = this.permissionsRep.create({
      tenant_id,
      role: UserRole.SUPERVISOR,
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
    });

    const vendedor = this.permissionsRep.create({
      tenant_id,
      role: UserRole.VENDEDOR,
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
    });

    if (manager) {
      await manager.save([supervisor, vendedor]);
    } else {
      await this.permissionsRep.save([supervisor, vendedor]);
    }
  }
}
