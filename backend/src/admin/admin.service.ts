import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../tenant/tenant.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
  ) {}

  async getAllTenants() {
    return this.tenantRepo.find({ order: { createdAt: 'DESC' } });
  }

  async getDashboardMetrics() {
    const total = await this.tenantRepo.count();
    const pending = await this.tenantRepo.count({ where: { status: TenantStatus.PENDING } });
    const approved = await this.tenantRepo.count({ where: { status: TenantStatus.APPROVED } });
    return { total, pending, approved };
  }

  async updateTenantStatus(id: string, status: TenantStatus) {
    const tenant = await this.tenantRepo.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tienda no encontrada');
    
    tenant.status = status;
    return this.tenantRepo.save(tenant);
  }
}
