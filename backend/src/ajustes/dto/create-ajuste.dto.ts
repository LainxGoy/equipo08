import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsEnum,
  IsUUID,
  IsOptional,
} from 'class-validator';
import { MotivoAjuste } from '../ajuste.entity';

export class CreateAjusteDto {
  @IsNotEmpty({ message: 'El ID de la sucursal es obligatorio' })
  @IsUUID('all', { message: 'Formato inválido para sucursal_id' })
  sucursal_id: string;

  @IsNotEmpty({ message: 'El ID del producto es obligatorio' })
  @IsUUID('all', { message: 'Formato inválido para producto_id' })
  producto_id: string;

  @IsNotEmpty({ message: 'La cantidad del sistema es obligatoria' })
  @IsNumber({}, { message: 'La cantidad_sistema debe ser un número' })
  cantidad_sistema: number;

  @IsNotEmpty({ message: 'La cantidad física contada es obligatoria' })
  @IsNumber({}, { message: 'La cantidad_fisica debe ser un número' })
  cantidad_fisica: number;

  @IsNotEmpty({
    message: 'Debe especificar el motivo del ajuste para procesar el acta.',
  })
  @IsEnum(MotivoAjuste, {
    message:
      'El motivo proporcionado no está en la lista de categorizaciones oficiales (ROBO_O_PERDIDA, DANO_MERMA, ERROR_REGISTRO)',
  })
  motivo: MotivoAjuste;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
