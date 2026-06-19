import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { TenantStatus } from '../tenant/tenant.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'super-secret-key-123', // Debe coincidir con la de AuthModule
    });
  }

  async validate(payload: any) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      relations: ['tenant', 'sucursal'],
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('USER_DISABLED');
    }

    if (user.tenant && user.tenant.status === TenantStatus.SUSPENDED) {
      throw new UnauthorizedException('TENANT_BLOCKED');
    }

    const currentSucursalId = user.sucursal_id || null;
    const payloadSucursalId = payload.sucursal_id || null;

    if (payload.role !== 'OWNER' && payload.role !== 'SUPER_ADMIN') {
      if (payloadSucursalId !== currentSucursalId) {
        throw new UnauthorizedException('BRANCH_CHANGED');
      }
    }

    if (user.sucursal && !user.sucursal.isActive) {
      throw new UnauthorizedException('BRANCH_DISABLED');
    }

    return {
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      tenantName: payload.tenantName,
    };
  }
}
