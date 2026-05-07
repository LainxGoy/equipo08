import { IsString, IsNumber, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLoteIngresoDto {
  @ApiProperty()
  @IsString()
  sucursal_id: string;

  @ApiProperty()
  @IsString()
  producto_id: string;

  @ApiProperty()
  @IsString()
  proveedor_id: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fechaElaboracion?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  fechaVencimiento?: string;
}
