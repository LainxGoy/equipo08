import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './tenant.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async getProfile(tenantId: string) {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tienda no encontrada');
    return tenant;
  }

  async updateProfile(
    tenantId: string,
    data: {
      name?: string;
      phone?: string;
      logoUrl?: string;
      bannerUrl?: string;
      brandColor?: string;
    },
  ) {
    const tenant = await this.tenantRepo.findOne({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tienda no encontrada');

    if (data.name !== undefined) tenant.name = data.name;
    if (data.phone !== undefined) tenant.phone = data.phone;
    if (data.logoUrl !== undefined) tenant.logoUrl = data.logoUrl;
    if (data.bannerUrl !== undefined) tenant.bannerUrl = data.bannerUrl;
    if (data.brandColor !== undefined) tenant.brandColor = data.brandColor;

    const updated = await this.tenantRepo.save(tenant);
    return updated;
  }
}
