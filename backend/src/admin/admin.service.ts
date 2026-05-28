import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatus } from '../tenant/tenant.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepo: Repository<Tenant>,
    private mailService: MailService,
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
    const savedTenant = await this.tenantRepo.save(tenant);

    if (tenant.email) {
      if (status === TenantStatus.APPROVED) {
        this.mailService.sendApprovalEmail(tenant.email, tenant.name).catch(e => console.error(e));
      } else if (status === TenantStatus.REJECTED || status === TenantStatus.SUSPENDED) {
        this.mailService.sendStatusEmail(tenant.email, tenant.name, status).catch(e => console.error(e));
      }
    }

    return savedTenant;
  }
}
