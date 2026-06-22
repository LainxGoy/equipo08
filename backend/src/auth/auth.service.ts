import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Tenant, TenantStatus } from '../tenant/tenant.entity';
import { User, UserRole } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRep: Repository<Tenant>,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    private readonly dataSource: DataSource,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{ message: string; tenant_id: string }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const existingTenant = await queryRunner.manager.findOne(Tenant, {
        where: [{ email: dto.email }, { domain: dto.domain }],
      });

      if (existingTenant) {
        throw new BadRequestException(
          'El correo o dominio ya está registrado para otra tienda.',
        );
      }

      // 1. Create Tenant
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(dto.password, salt);

      const newTenant = queryRunner.manager.create(Tenant, {
        name: dto.name,
        domain: dto.domain,
        email: dto.email,
        phone: dto.phone,
        ubicacion: dto.ubicacion,
        nit: dto.nit,
        razonSocial: dto.razonSocial,
      });

      const savedTenant = await queryRunner.manager.save(newTenant);

      // 2. Create Root User (OWNER)
      const user = queryRunner.manager.create(User, {
        name: 'Administrador',
        email: dto.email,
        passwordHash: hashedPassword,
        role: UserRole.OWNER,
        tenant_id: savedTenant.id,
      });
      await queryRunner.manager.save(user);

      // 3. Seed Default Permissions
      await this.usersService.seedDefaultPermissions(
        savedTenant.id,
        queryRunner.manager,
      );

      await queryRunner.commitTransaction();

      // Enviar correo de confirmación de registro de forma asíncrona
      this.mailService
        .sendRegistrationEmail(dto.email, dto.name)
        .catch((e) => console.error(e));

      return {
        message: 'Cuenta creada y pendiente de aprobación.',
        tenant_id: savedTenant.id,
      };
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async login(dto: LoginDto): Promise<{ access_token: string; user: any }> {
    // 1. Intentar buscar en la nueva tabla de usuarios
    let user = await this.dataSource.getRepository(User).findOne({
      where: { email: dto.email },
      relations: ['sucursal'],
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Flujo Normal: Verificar password del User
    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('La cuenta de usuario está inactiva');
    }

    // Cargar tenant manualmente (ya no es una relación FK)
    let tenant: Tenant | null = null;
    if (user.tenant_id) {
      tenant = await this.dataSource.getRepository(Tenant).findOne({ where: { id: user.tenant_id } });
    }

    // Permitir login a SUPER_ADMIN independientemente del tenant
    if (user.role !== UserRole.SUPER_ADMIN) {
      if (!tenant) {
        throw new UnauthorizedException('Usuario sin tienda asignada');
      }
      if (!tenant.isActive) {
        throw new UnauthorizedException('La tienda está inactiva');
      }
      if (tenant.status === TenantStatus.PENDING) {
        throw new UnauthorizedException('PENDING_APPROVAL');
      }
      if (tenant.status !== TenantStatus.APPROVED) {
        throw new UnauthorizedException(
          `La tienda no está aprobada (Estado: ${tenant.status})`,
        );
      }
    }

    const payload = {
      sub: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      tenantName: tenant?.name || 'Administración Global',
      sucursal_id: user.sucursal_id,
    };

    let userPermissions = null;
    if (
      user.role !== UserRole.OWNER &&
      user.role !== UserRole.SUPER_ADMIN &&
      user.tenant_id
    ) {
      const allPermissions = await this.usersService.getPermissions(
        user.tenant_id,
      );
      userPermissions = allPermissions.find((p) => p.role === user.role) || {};
    }

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenant_id: user.tenant_id,
        tenant_name: tenant?.name || 'Administración Global',
        tenant_domain: tenant?.domain || null,
        tenant_logoUrl: tenant?.logoUrl || null,
        sucursal_id: user.sucursal_id || null,
        sucursal_name: user.sucursal?.name || null,
        permissions: userPermissions,
      },
    };
  }
}
