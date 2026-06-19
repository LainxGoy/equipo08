import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../tenant/tenant.entity';
import { Producto } from '../productos/producto.entity';
import { Stock } from '../stock/stock.entity';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
    @InjectRepository(Stock)
    private readonly stockRepo: Repository<Stock>,
  ) {}

  async getCatalogByDomain(domain: string) {
    const tenant = await this.tenantRepo.findOne({
      where: { domain, status: TenantStatus.APPROVED, isActive: true },
    });

    if (!tenant) {
      throw new NotFoundException('Tienda no encontrada o no disponible');
    }

    const productos = await this.productoRepo.find({
      where: { tenant_id: tenant.id },
    });

    const productosConStock = await Promise.all(
      productos.map(async (prod) => {
        const stocks = await this.stockRepo.find({
          where: { tenant_id: tenant.id, producto_id: prod.id },
        });
        const stockTotal = stocks.reduce(
          (acc, curr) => acc + curr.cantidadTotal,
          0,
        );
        return {
          id: prod.id,
          name: prod.name,
          sku: prod.sku,
          description: prod.description,
          category: prod.category,
          precioVenta: prod.precioVenta,
          imagen_url: prod.imagen_url,
          attributes: prod.attributes,
          stockTotal,
        };
      }),
    );

    return {
      tienda: {
        id: tenant.id,
        name: tenant.name,
        domain: tenant.domain,
        logoUrl: tenant.logoUrl,
        bannerUrl: tenant.bannerUrl,
        brandColor: tenant.brandColor,
        phone: tenant.phone,
      },
      productos: productosConStock.filter((p) => p.stockTotal > 0), // Solo mostrar con stock
    };
  }
}
