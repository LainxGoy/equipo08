import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { UserRole } from '../user.entity';

export class UpdatePermissionsDto {
  @IsEnum([UserRole.SUPERVISOR, UserRole.VENDEDOR], {
    message: 'Solo se pueden configurar permisos para SUPERVISOR o VENDEDOR',
  })
  @IsNotEmpty()
  role: string;

  @IsBoolean() @IsOptional() sucursales_ver?: boolean;
  @IsBoolean() @IsOptional() sucursales_crear?: boolean;
  @IsBoolean() @IsOptional() sucursales_editar?: boolean;
  @IsBoolean() @IsOptional() sucursales_eliminar?: boolean;

  @IsBoolean() @IsOptional() catalogo_ver?: boolean;
  @IsBoolean() @IsOptional() catalogo_crear?: boolean;
  @IsBoolean() @IsOptional() catalogo_editar?: boolean;
  @IsBoolean() @IsOptional() catalogo_eliminar?: boolean;

  @IsBoolean() @IsOptional() proveedores_ver?: boolean;
  @IsBoolean() @IsOptional() proveedores_crear?: boolean;
  @IsBoolean() @IsOptional() proveedores_editar?: boolean;
  @IsBoolean() @IsOptional() proveedores_eliminar?: boolean;

  @IsBoolean() @IsOptional() sourcing_ver?: boolean;
  @IsBoolean() @IsOptional() sourcing_crear?: boolean;
  @IsBoolean() @IsOptional() sourcing_editar?: boolean;
  @IsBoolean() @IsOptional() sourcing_eliminar?: boolean;

  @IsBoolean() @IsOptional() inventario_ver?: boolean;
  @IsBoolean() @IsOptional() inventario_crear?: boolean;
  @IsBoolean() @IsOptional() inventario_editar?: boolean;
  @IsBoolean() @IsOptional() inventario_eliminar?: boolean;

  @IsBoolean() @IsOptional() usuarios_ver?: boolean;
  @IsBoolean() @IsOptional() usuarios_crear?: boolean;
  @IsBoolean() @IsOptional() usuarios_editar?: boolean;
  @IsBoolean() @IsOptional() usuarios_eliminar?: boolean;

  @IsBoolean() @IsOptional() ventas_ver?: boolean;
  @IsBoolean() @IsOptional() ventas_crear?: boolean;
  @IsBoolean() @IsOptional() ventas_editar?: boolean;
  @IsBoolean() @IsOptional() ventas_eliminar?: boolean;
}
