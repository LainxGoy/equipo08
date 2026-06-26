import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, ILike, IsNull, DataSource, In } from 'typeorm';
import { Producto } from './producto.entity';
import { Categoria } from './categoria.entity';
import { ProductoVariacion } from './producto-variacion.entity';
import { CreateProductoDto } from './dto/create-producto.dto';
import { LoteIngreso } from '../sourcing/lote-ingreso.entity';
import { Stock } from '../stock/stock.entity';
import { AjusteInventario } from '../ajustes/ajuste.entity';
import { VentaDetalle } from '../ventas/venta-detalle.entity';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly prodRep: Repository<Producto>,
    private readonly dataSource: DataSource,
  ) {}

  private async validateProducto(
    tenant_id: string,
    dto: Partial<CreateProductoDto>,
    excludeId?: string,
  ) {
    if (dto.precioCosto !== undefined && dto.precioVenta !== undefined) {
      if (dto.precioVenta < dto.precioCosto) {
        throw new BadRequestException(
          'Alerta de Rentabilidad: Tu margen de ganancia es negativo. Estás configurando una venta a pérdida matemática.',
        );
      }
    }

    if (dto.attributes) {
      for (const [key, value] of Object.entries(dto.attributes)) {
        if (value === undefined || value === null || value === '') continue;
        const strVal = String(value).trim();
        
        if (key === 'peso' || key === 'volumen_ml' || key === 'garantia') {
          if (key === 'peso') {
            if (!/^\d+(\.\d+)?$/.test(strVal)) {
              throw new BadRequestException(
                `El atributo 'Peso/Gramaje' debe ser un valor numérico válido (ej. 500 o 1.5).`,
              );
            }
          } else {
            const labelName = key === 'volumen_ml' ? 'Volumen (ML)' : 'Garantía (Meses)';
            if (!/^\d+$/.test(strVal)) {
              throw new BadRequestException(
                `El atributo '${labelName}' debe contener únicamente números enteros.`,
              );
            }
          }
        } else {
          if (!/^[A-Za-záéíóúÁÉÍÓÚñÑ0-9\s\-]+$/.test(strVal)) {
            throw new BadRequestException(
              `El atributo '${key}' no debe contener símbolos especiales. Solo se permiten letras, números, espacios y guiones.`,
            );
          }
        }
      }
    }

    if (dto.name) {
      if (
        !/^[A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s\-丨\|]*[A-Za-záéíóúÁÉÍÓÚñÑ][A-Za-z0-9áéíóúÁÉÍÓÚñÑ\s\-丨\|]*$/.test(
          dto.name,
        )
      ) {
        throw new BadRequestException(
          'El nombre del artículo no puede contener símbolos especiales (excepto guiones o barras verticales) y debe tener al menos una letra (no puede ser solo números).',
        );
      }

      const existingExact = await this.prodRep.findOne({
        where: {
          tenant_id,
          name: ILike(dto.name),
          description: dto.description ? ILike(dto.description) : IsNull(),
          ...(excludeId ? { id: Not(excludeId) } : {}),
        },
      });
      if (existingExact) {
        throw new BadRequestException(
          `Ya existe un artículo registrado con el nombre '${dto.name}' y la variante '${dto.description || 'Sin Variante'}'. Evita duplicados exactos.`,
        );
      }
    }

    if (dto.sku) {
      // Minimum 3 characters, alphanumeric + hyphen
      if (!/^[A-Za-z0-9\-]{3,}$/.test(dto.sku)) {
        throw new BadRequestException(
          'El código SKU debe tener un mínimo de 3 caracteres y solo permite letras, números y guiones (-).',
        );
      }

      const existingSku = await this.prodRep.findOne({
        where: {
          tenant_id,
          sku: ILike(dto.sku),
          ...(excludeId ? { id: Not(excludeId) } : {}),
        },
      });
      if (existingSku) {
        throw new BadRequestException(
          `El SKU '${dto.sku}' ya está siendo usado por otro artículo.`,
        );
      }
    }
  }

  async create(tenant_id: string, dto: CreateProductoDto): Promise<Producto> {
    await this.validateProducto(tenant_id, dto);

    // Usamos transaccionalidad para asegurar consistencia del producto base y su variante por defecto
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let categoriaId = dto.categoria_id;
      if (!categoriaId && dto.category) {
        const catRep = queryRunner.manager.getRepository(Categoria);
        let cat = await catRep.findOne({
          where: { tenant_id, nombre: ILike(dto.category) },
        });
        if (!cat) {
          cat = catRep.create({ tenant_id, nombre: dto.category.trim() });
          cat = await catRep.save(cat);
        }
        categoriaId = cat.id;
      }

      const prod = queryRunner.manager.create(Producto, {
        ...dto,
        categoria_id: categoriaId,
        tenant_id,
      });
      const prodSaved = await queryRunner.manager.save(prod);

      // Crear variante por defecto basada en la información clásica
      const varRep = queryRunner.manager.getRepository(ProductoVariacion);
      const defaultVar = varRep.create({
        producto_id: prodSaved.id,
        sku: dto.sku,
        precioCosto: dto.precioCosto || 0,
        precioVenta: dto.precioVenta || 0,
        opciones: dto.attributes || {},
      });
      await queryRunner.manager.save(defaultVar);

      await queryRunner.commitTransaction();
      return prodSaved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(tenant_id: string): Promise<Producto[]> {
    const productos = await this.prodRep.find({
      where: { tenant_id },
      relations: ['proveedor', 'stocks', 'categoria', 'variaciones'],
    });

    // Mapeamos para garantizar compatibilidad hacia atrás con el frontend:
    // Hacemos que 'category' refleje siempre el nombre de la categoría enlazada.
    return productos.map(p => {
      // Tomamos la primera variante (o creamos una simulación en memoria si no tiene)
      const variant = p.variaciones && p.variaciones.length > 0 ? p.variaciones[0] : null;
      return {
        ...p,
        sku: variant ? variant.sku : p.sku,
        precioCosto: variant ? Number(variant.precioCosto) : Number(p.precioCosto),
        precioVenta: variant ? Number(variant.precioVenta) : Number(p.precioVenta),
        attributes: variant ? variant.opciones : p.attributes,
        category: p.categoria ? p.categoria.nombre : (p as any).category,
      };
    }) as any;
  }

  async update(
    tenant_id: string,
    id: string,
    dto: Partial<CreateProductoDto>,
  ): Promise<Producto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const prod = await queryRunner.manager.findOne(Producto, {
        where: { id, tenant_id },
        relations: ['variaciones'],
      });
      if (!prod) throw new NotFoundException('Producto no encontrado');

      await this.validateProducto(tenant_id, dto, id);

      if (dto.proveedor_id === '') {
        delete dto.proveedor_id;
      }
      if (dto.categoria_id === '') {
        delete dto.categoria_id;
      }

      let categoriaId = dto.categoria_id;
      if (!categoriaId && dto.category) {
        const catRep = queryRunner.manager.getRepository(Categoria);
        let cat = await catRep.findOne({
          where: { tenant_id, nombre: ILike(dto.category) },
        });
        if (!cat) {
          cat = catRep.create({ tenant_id, nombre: dto.category.trim() });
          cat = await catRep.save(cat);
        }
        categoriaId = cat.id;
      }

      Object.assign(prod, {
        ...dto,
        ...(categoriaId ? { categoria_id: categoriaId } : {}),
      });
      const prodSaved = await queryRunner.manager.save(prod);

      // Sincronizar con la variante por defecto (primera variante)
      if (prod.variaciones && prod.variaciones.length > 0) {
        const defaultVar = prod.variaciones[0];
        if (dto.sku !== undefined) defaultVar.sku = dto.sku;
        if (dto.precioCosto !== undefined) defaultVar.precioCosto = dto.precioCosto;
        if (dto.precioVenta !== undefined) defaultVar.precioVenta = dto.precioVenta;
        if (dto.attributes !== undefined) defaultVar.opciones = dto.attributes;
        await queryRunner.manager.save(defaultVar);
      } else {
        // En caso de que no tenga variantes (ej. si fue creado antes de la migración)
        const varRep = queryRunner.manager.getRepository(ProductoVariacion);
        const defaultVar = varRep.create({
          producto_id: prodSaved.id,
          sku: dto.sku || prodSaved.sku,
          precioCosto: dto.precioCosto !== undefined ? dto.precioCosto : prodSaved.precioCosto,
          precioVenta: dto.precioVenta !== undefined ? dto.precioVenta : prodSaved.precioVenta,
          opciones: dto.attributes || prodSaved.attributes || {},
        });
        await queryRunner.manager.save(defaultVar);
      }

      await queryRunner.commitTransaction();
      return prodSaved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async remove(tenant_id: string, id: string): Promise<void> {
    const prod = await this.prodRep.findOne({ where: { id, tenant_id } });
    if (!prod) throw new NotFoundException('Producto no encontrado');

    // Check if there are any active batch history (lotes) via stock records
    const stockRecords = await this.dataSource.getRepository(Stock).find({
      where: { producto_id: id },
      select: ['id'],
    });
    const stockIds = stockRecords.map(s => s.id);
    if (stockIds.length > 0) {
      const lotesCount = await this.dataSource.getRepository(LoteIngreso).count({
        where: { stock_id: In(stockIds) as any },
      });
      if (lotesCount > 0) {
        throw new BadRequestException(
          'No se puede eliminar el producto porque tiene un historial de lotes de ingreso registrado.',
        );
      }
    }

    // Check if there are any inventory adjustments (via stock records)
    if (stockIds.length > 0) {
      const ajustesCount = await this.dataSource
        .getRepository(AjusteInventario)
        .createQueryBuilder('a')
        .where('a.stock_id IN (:...stockIds)', { stockIds })
        .getCount();
      if (ajustesCount > 0) {
        throw new BadRequestException(
          'No se puede eliminar el producto porque tiene un historial de ajustes de inventario registrado.',
        );
      }
    }

    const ventasCount = await this.dataSource
      .getRepository(VentaDetalle)
      .count({
        where: { producto_id: id },
      });
    if (ventasCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar el producto porque tiene historial de ventas registrado.',
      );
    }

    // Check if there is active stock in any branch
    const activeStocks = await this.dataSource.getRepository(Stock).find({
      where: { producto_id: id },
    });
    const totalStock = activeStocks.reduce(
      (acc, s) => acc + (s.cantidadActual || 0),
      0,
    );
    if (totalStock > 0) {
      throw new BadRequestException(
        `No se puede eliminar el producto porque cuenta con stock activo (${totalStock} unidades en total) en tus sucursales.`,
      );
    }

    // If we passed all checks, we can safely delete the empty stock records
    if (activeStocks.length > 0) {
      await this.dataSource.getRepository(Stock).remove(activeStocks);
    }

    // Now delete the product
    await this.prodRep.remove(prod);
  }

  async findCategorias(tenantId: string): Promise<Categoria[]> {
    const catRep = this.dataSource.getRepository(Categoria);
    const count = await catRep.count({ where: { tenant_id: tenantId } });

    if (count === 0) {
      const defaultNames = [
        'Abarrotes y Alimentos',
        'Bebidas',
        'Ropa y Moda',
        'Zapatos y Calzado',
        'Belleza y Cuidado Personal',
        'Joyería y Relojes',
        'Juguetes y Niños',
        'Hogar y Decoración',
        'Electrónica y Tecnología',
        'Ferretería y Construcción',
        'Deportes y Aire Libre',
        'Otros',
      ];
      const catsToCreate = defaultNames.map(name =>
        catRep.create({ tenant_id: tenantId, nombre: name }),
      );
      await catRep.save(catsToCreate);
    }

    return catRep.find({
      where: { tenant_id: tenantId },
      order: { nombre: 'ASC' },
    });
  }

  async createCategoria(tenantId: string, nombre: string): Promise<Categoria> {
    const catRep = this.dataSource.getRepository(Categoria);
    const cleanName = nombre.trim();
    if (!cleanName) {
      throw new BadRequestException('El nombre de la categoría no puede estar vacío.');
    }

    const existing = await catRep.findOne({
      where: { tenant_id: tenantId, nombre: ILike(cleanName) },
    });
    if (existing) {
      throw new BadRequestException(`La categoría '${cleanName}' ya existe.`);
    }

    const cat = catRep.create({ tenant_id: tenantId, nombre: cleanName });
    return catRep.save(cat);
  }

  async updateCategoria(
    tenantId: string,
    id: string,
    nombre: string,
  ): Promise<Categoria> {
    const catRep = this.dataSource.getRepository(Categoria);
    const cleanName = nombre.trim();
    if (!cleanName) {
      throw new BadRequestException('El nombre de la categoría no puede estar vacío.');
    }

    const cat = await catRep.findOne({ where: { id, tenant_id: tenantId } });
    if (!cat) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const existing = await catRep.findOne({
      where: { tenant_id: tenantId, nombre: ILike(cleanName), id: Not(id) },
    });
    if (existing) {
      throw new BadRequestException(`La categoría '${cleanName}' ya existe.`);
    }

    cat.nombre = cleanName;
    return catRep.save(cat);
  }

  async removeCategoria(tenantId: string, id: string): Promise<void> {
    const catRep = this.dataSource.getRepository(Categoria);
    const cat = await catRep.findOne({ where: { id, tenant_id: tenantId } });
    if (!cat) {
      throw new NotFoundException('Categoría no encontrada');
    }

    const linkedProducts = await this.prodRep.count({
      where: { tenant_id: tenantId, categoria_id: id },
    });
    if (linkedProducts > 0) {
      throw new BadRequestException(
        'No se puede eliminar la categoría porque tiene productos asociados.',
      );
    }

    await catRep.remove(cat);
  }
}

