import {
  IsEmail,
  IsNotEmpty,
  IsEnum,
  MinLength,
  Matches,
  IsOptional,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '../user.entity';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Matches(/^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre no puede contener números ni símbolos',
  })
  name: string;

  @IsEmail({}, { message: 'El correo electrónico no tiene un formato válido' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsEnum(UserRole, { message: 'El rol seleccionado no es válido' })
  role: UserRole;

  @IsOptional()
  @IsUUID('all', { message: 'ID de sucursal no válido' })
  sucursal_id?: string;

  @IsOptional()
  @IsBoolean({ message: 'El estado debe ser un valor booleano' })
  isActive?: boolean;
}
