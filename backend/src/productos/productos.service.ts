import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, ILike, IsNull } from 'typeorm';
import { Producto } from './producto.entity';
import { CreateProductoDto } from './dto/create-producto.dto';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly prodRep: Repository<Producto>,
  ) {}

  private async validateProducto(tenant_id: string, dto: Partial<CreateProductoDto>, excludeId?: string) {
    if (dto.precioCosto !== undefined && dto.precioVenta !== undefined) {
      if (dto.precioVenta < dto.precioCosto) {
        throw new BadRequestException('Alerta de Rentabilidad: Tu margen de ganancia es negativo. Estás configurando una venta a pérdida matemática.');
      }
    }

    if (dto.name) {
      
      if (!/^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]*[A-Za-záéíóúÁÉÍÓÚñÑ][A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s]*$/.test(dto.name)) {
        throw new BadRequestException('El nombre del artículo no puede contener símbolos y debe tener al menos una letra (no puede ser solo números).');
      }

      const existingExact = await this.prodRep.findOne({
        where: { 
          tenant_id, 
          name: ILike(dto.name), 
          description: dto.description ? ILike(dto.description) : IsNull(),
          ...(excludeId ? { id: Not(excludeId) } : {}) 
        }
      });
      if (existingExact) {
        throw new BadRequestException(`Ya existe un artículo registrado con el nombre '${dto.name}' y la variante '${dto.description || 'Sin Variante'}'. Evita duplicados exactos.`);
      }
    }
    
    if (dto.sku) {
      // Minimum 3 characters, alphanumeric + hyphen
      if (!/^[A-Za-z0-9\-]{3,}$/.test(dto.sku)) {
        throw new BadRequestException('El código SKU debe tener un mínimo de 3 caracteres y solo permite letras, números y guiones (-).');
      }

      const existingSku = await this.prodRep.findOne({
        where: { 
          tenant_id, 
          sku: ILike(dto.sku), 
          ...(excludeId ? { id: Not(excludeId) } : {}) 
        }
      });
      if (existingSku) {
        throw new BadRequestException(`El SKU '${dto.sku}' ya está siendo usado por otro artículo.`);
      }
    }
  }

  async create(tenant_id: string, dto: CreateProductoDto): Promise<Producto> {
    await this.validateProducto(tenant_id, dto);
    
    // Evitar bug de Postgres "invalid input syntax for type uuid" cuando frontend envía string vacío
    if (dto.proveedor_id === '') {
      delete dto.proveedor_id;
    }

    const prod = this.prodRep.create({ ...dto, tenant_id });
    return this.prodRep.save(prod);
  }

  async findAll(tenant_id: string): Promise<Producto[]> {
    return this.prodRep.find({ where: { tenant_id }, relations: ['proveedor', 'stocks'] });
  }

  async update(tenant_id: string, id: string, dto: Partial<CreateProductoDto>): Promise<Producto> {
    const prod = await this.prodRep.findOne({ where: { id, tenant_id } });
    if (!prod) throw new NotFoundException('Producto no encontrado');
    
    await this.validateProducto(tenant_id, dto, id);

    if (dto.proveedor_id === '') {
      delete dto.proveedor_id;
    }

    Object.assign(prod, dto);
    return this.prodRep.save(prod);
  }

  async remove(tenant_id: string, id: string): Promise<void> {
    const prod = await this.prodRep.findOne({ where: { id, tenant_id } });
    if (!prod) throw new NotFoundException('Producto no encontrado');

    try {
      await this.prodRep.remove(prod);
    } catch (e) {
      if (e.code === '23503') {
        throw new BadRequestException('No se puede eliminar el producto porque tiene stock o historial de ingresos asociado. Esto corrompería la integridad contable.');
      }
      throw e;
    }
  }
}
