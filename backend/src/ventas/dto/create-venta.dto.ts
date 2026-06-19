import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

class VentaItemDto {
  @IsString()
  @IsNotEmpty()
  producto_id: string;

  @IsNumber()
  @Min(1)
  cantidad: number;
}

export class CreateVentaDto {
  @IsString()
  @IsNotEmpty()
  sucursal_id: string;

  @IsString()
  @IsNotEmpty()
  clienteNombre: string;

  @IsString()
  @IsOptional()
  clienteDocumento?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items: VentaItemDto[];

  @IsString()
  @IsOptional()
  metodoPago?: string;

  @IsNumber()
  @IsOptional()
  montoRecibido?: number;

  @IsNumber()
  @IsOptional()
  cambio?: number;

  @IsString()
  @IsOptional()
  vendedorNombre?: string;
}
