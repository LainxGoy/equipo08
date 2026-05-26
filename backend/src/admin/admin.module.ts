import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Tenant } from '../tenant/tenant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
