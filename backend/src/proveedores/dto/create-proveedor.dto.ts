import { IsString, IsEmail, IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProveedorDto {
  @ApiProperty()
  @IsString()
  @MaxLength(20, { message: 'La razón social no debe exceder los 20 caracteres.' })
  @Matches(/^[A-Za-záéíóúÁÉÍÓÚñÑ0-9\s]+$/, { message: 'La razón social solo debe contener letras, números y espacios.' })
  name: string;

  @ApiProperty({ required: false })
  @IsEmail()
  @IsOptional()
  contactEmail?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\d{1,8}$/, { message: 'El número de teléfono debe contener únicamente hasta 8 dígitos numéricos.' })
  phone?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @Matches(/^\d{8,12}$/, { message: 'El NIT o RUT debe contener únicamente entre 8 y 12 números, sin letras ni símbolos.' })
  taxId?: string;
}
