import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sucursal } from './sucursal.entity';
import { CreateSucursalDto } from './dto/create-sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(
    @InjectRepository(Sucursal)
    private readonly sucRep: Repository<Sucursal>,
  ) {}

  async create(tenant_id: string, dto: CreateSucursalDto): Promise<Sucursal> {
    const existing = await this.sucRep.findOne({
      where: { tenant_id, name: dto.name },
    });
    if (existing)
      throw new BadRequestException(
        'Ya existe una sucursal con ese nombre en tu empresa.',
      );

    const sucursal = this.sucRep.create({ ...dto, tenant_id });
    return this.sucRep.save(sucursal);
  }

  async findAll(tenant_id: string): Promise<Sucursal[]> {
    return this.sucRep.find({
      where: { tenant_id },
      order: { createdAt: 'ASC' },
    });
  }

  async update(
    tenant_id: string,
    id: string,
    dto: Partial<CreateSucursalDto>,
  ): Promise<Sucursal> {
    const sucursal = await this.sucRep.findOne({ where: { id, tenant_id } });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

    if (dto.name && dto.name !== sucursal.name) {
      const existing = await this.sucRep.findOne({
        where: { tenant_id, name: dto.name },
      });
      if (existing)
        throw new BadRequestException(
          'Ya existe otra sucursal con ese nombre.',
        );
    }

    Object.assign(sucursal, dto);
    return this.sucRep.save(sucursal);
  }

  async remove(tenant_id: string, id: string): Promise<void> {
    const sucursal = await this.sucRep.findOne({ where: { id, tenant_id } });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

    try {
      await this.sucRep.remove(sucursal);
    } catch (e) {
      if (e.code === '23503') {
        throw new BadRequestException(
          'No puedes eliminar esta sucursal porque tiene historial de inventario, lotes o productos asociados. Inactívala en su lugar.',
        );
      }
      throw e;
    }
  }
}
