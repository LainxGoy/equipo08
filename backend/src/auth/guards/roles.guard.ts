import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '../../users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    // El Super Admin tiene permiso para todo
    if (user.role === UserRole.SUPER_ADMIN) return true;
    
    // Si la ruta requiere SUPER_ADMIN, nadie más puede entrar
    if (requiredRoles.includes(UserRole.SUPER_ADMIN)) return false;

    // El dueño de la tienda tiene permiso para todo dentro de su tienda
    if (user.role === UserRole.OWNER) return true;
    
    return requiredRoles.includes(user.role);
  }
}
