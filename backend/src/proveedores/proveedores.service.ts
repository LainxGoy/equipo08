import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Proveedor } from './proveedor.entity';
import { CreateProveedorDto } from './dto/create-proveedor.dto';

@Injectable()
export class ProveedoresService implements OnModuleInit {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveRep: Repository<Proveedor>,
  ) {}

  async onModuleInit() {
    const globals = [
      {
        name: 'Coca Cola Oficial',
        taxId: '10002000',
        contactEmail: 'ventas@cocacola.com',
      },
      {
        name: 'Nestlé Master',
        taxId: '20003000',
        contactEmail: 'distribucion@nestle.com',
      },
      {
        name: 'Nike Corp',
        taxId: '30004000',
        contactEmail: 'wholesale@nike.com',
      },
      {
        name: 'Samsung Electronics',
        taxId: '40005000',
        contactEmail: 'b2b@samsung.com',
      },
      {
        name: 'Apple Inc.',
        taxId: '50006000',
        contactEmail: 'reseller@apple.com',
      },
      {
        name: 'PIL Andina S.A.',
        taxId: '60007000',
        contactEmail: 'ventas@pil.com.bo',
      },
      {
        name: 'Sony Corporation',
        taxId: '70008000',
        contactEmail: 'playstation@sony.com',
      },
      {
        name: 'Kimberly-Clark',
        taxId: '80009000',
        contactEmail: 'ventas@kimberly.com',
      },
      {
        name: 'Unilever Latam',
        taxId: '90001000',
        contactEmail: 'proveedores@unilever.com',
      },
      {
        name: 'Adidas AG',
        taxId: '10001000',
        contactEmail: 'distributor@adidas.com',
      },
    ];

    for (const g of globals) {
      const exists = await this.proveRep.findOne({
        where: { tenant_id: 'GLOBAL', taxId: g.taxId },
      });
      if (!exists) {
        const prov = this.proveRep.create({ ...g, tenant_id: 'GLOBAL' });
        await this.proveRep.save(prov);
      }
    }
  }

  private async validateProveedor(
    tenant_id: string,
    dto: Partial<CreateProveedorDto>,
    excludeId?: string,
  ) {
    if (dto.name && !/^[A-Za-záéíóúÁÉÍÓÚñÑ\s]+$/.test(dto.name)) {
      throw new BadRequestException(
        'El nombre del proveedor no debe incluir números ni símbolos.',
      );
    }

    if (dto.taxId) {
      if (!/^\d{8,12}$/.test(dto.taxId)) {
        throw new BadRequestException(
          'El NIT o RUT debe contener únicamente entre 8 y 12 números, sin letras ni símbolos.',
        );
      }

      const existingTax = await this.proveRep.findOne({
        where: {
          tenant_id,
          taxId: dto.taxId,
          ...(excludeId ? { id: Not(excludeId) } : {}),
        },
      });
      if (existingTax)
        throw new BadRequestException(
          `El NIT/RUT '${dto.taxId}' ya está asignado a otro proveedor.`,
        );
    }

    if (dto.contactEmail) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dto.contactEmail)) {
        throw new BadRequestException(
          'El formato del correo electrónico u omite un símbolo @ o un dominio válido.',
        );
      }

      const existingEmail = await this.proveRep.findOne({
        where: {
          tenant_id,
          contactEmail: dto.contactEmail,
          ...(excludeId ? { id: Not(excludeId) } : {}),
        },
      });
      if (existingEmail)
        throw new BadRequestException(
          `El correo '${dto.contactEmail}' ya está registrado en tu directorio.`,
        );
    }
  }

  async create(tenant_id: string, dto: CreateProveedorDto): Promise<Proveedor> {
    if (!dto.taxId)
      throw new BadRequestException(
        'NIT es obligatorio para agregar un proveedor.',
      );

    // 1. Buscar si ya existe en el directorio global
    let globalProv = await this.proveRep.findOne({
      where: { tenant_id: 'GLOBAL', taxId: dto.taxId },
    });

    if (!globalProv) {
      // Si no existe globalmente, lo creamos para que otras tiendas puedan reutilizarlo
      if (!dto.name)
        throw new BadRequestException(
          'El nombre del proveedor es obligatorio para registrar un NIT nuevo.',
        );
      globalProv = this.proveRep.create({
        tenant_id: 'GLOBAL',
        name: dto.name,
        taxId: dto.taxId,
        contactEmail: dto.contactEmail || undefined,
      });
      await this.proveRep.save(globalProv);
    } else {
      // Si ya existe globalmente, heredamos su nombre oficial y correo
      dto.name = globalProv.name;
      dto.contactEmail = globalProv.contactEmail || dto.contactEmail;
    }

    await this.validateProveedor(tenant_id, dto);
    const proveedor = this.proveRep.create({ ...dto, tenant_id });
    return this.proveRep.save(proveedor);
  }

  async findByGlobalNit(nit: string): Promise<Proveedor | null> {
    const prov = await this.proveRep.findOne({
      where: { tenant_id: 'GLOBAL', taxId: nit },
    });
    return prov;
  }

  async findAll(tenant_id: string): Promise<Proveedor[]> {
    return this.proveRep.find({ where: { tenant_id } });
  }

  async update(
    tenant_id: string,
    id: string,
    dto: Partial<CreateProveedorDto>,
  ): Promise<Proveedor> {
    const proveedor = await this.proveRep.findOne({ where: { id, tenant_id } });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

    await this.validateProveedor(tenant_id, dto, id);

    // Copy the updated properties
    Object.assign(proveedor, dto);
    return this.proveRep.save(proveedor);
  }

  async remove(tenant_id: string, id: string): Promise<void> {
    const proveedor = await this.proveRep.findOne({ where: { id, tenant_id } });
    if (!proveedor) throw new NotFoundException('Proveedor no encontrado');

    try {
      await this.proveRep.remove(proveedor);
    } catch (e) {
      if (e.code === '23503') {
        // Foreign key constraint
        throw new NotFoundException(
          'No se puede eliminar el proveedor. Está asociado a productos o lotes de compra en tu catálogo.',
        );
      }
      throw e;
    }
  }
}
