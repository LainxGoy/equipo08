import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantModule } from './tenant/tenant.module';
import { AuthModule } from './auth/auth.module';
import { ProveedoresModule } from './proveedores/proveedores.module';
import { SourcingModule } from './sourcing/sourcing.module';
import { StockModule } from './stock/stock.module';
import { ProductosModule } from './productos/productos.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { UsersModule } from './users/users.module';
import { AjustesModule } from './ajustes/ajustes.module';
import { VentasModule } from './ventas/ventas.module';
import { AdminModule } from './admin/admin.module';
import { CatalogModule } from './catalog/catalog.module';
import { MailModule } from './mail/mail.module';

import { Tenant } from './tenant/tenant.entity';
import { Proveedor } from './proveedores/proveedor.entity';
import { Producto } from './productos/producto.entity';
import { Sucursal } from './sucursales/sucursal.entity';
import { LoteIngreso } from './sourcing/lote-ingreso.entity';
import { Stock } from './stock/stock.entity';
import { User } from './users/user.entity';
import { RolePermissions } from './users/role-permissions.entity';
import { AjusteInventario } from './ajustes/ajuste.entity';
import { Venta } from './ventas/venta.entity';

import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '1234',
      database: 'mall_db',
      entities: [Tenant, Proveedor, Producto, LoteIngreso, Stock, Sucursal, User, RolePermissions, AjusteInventario, Venta],
      synchronize: true,
    }),
    AuthModule,
    TenantModule,
    ProveedoresModule,
    SourcingModule,
    StockModule,
    ProductosModule,
    SucursalesModule,
    UsersModule,
    AjustesModule,
    VentasModule,
    AdminModule,
    CatalogModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
