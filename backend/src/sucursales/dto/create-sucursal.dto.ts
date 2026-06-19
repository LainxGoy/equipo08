import { IsString, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSucursalDto {
  @ApiProperty()
  @IsString()
  @Matches(
    /^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]*[A-Za-záéíóúÁÉÍÓÚñÑ][A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]*$/,
    {
      message:
        'El nombre de la sucursal no puede contener símbolos y debe tener al menos una letra.',
    },
  )
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s.,#\-]*$/, {
    message: 'La dirección contiene caracteres no permitidos.',
  })
  address?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(/^[0-9]{8}$/, {
    message:
      'El número de teléfono debe ser exactamente de 8 dígitos numéricos.',
  })
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  horarios?: string;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
