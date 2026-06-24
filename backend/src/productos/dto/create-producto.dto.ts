import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  sku: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  attributes?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imagen_url?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(999999999999999, { message: 'El stock mínimo no puede superar los 15 dígitos.' })
  stockMinimo?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(999999999999999, { message: 'El precio de costo no puede superar los 15 dígitos.' })
  precioCosto: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  @Max(999999999999999, { message: 'El precio de venta no puede superar los 15 dígitos.' })
  precioVenta: number;

  @ApiProperty()
  @IsString()
  @IsOptional() // In case it's orphan initially
  proveedor_id?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  categoria_id?: string;
}
