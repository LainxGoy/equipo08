import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
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
  stockMinimo?: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  precioCosto: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
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
