import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Stock } from '../src/stock/stock.entity';
import { Producto } from '../src/productos/producto.entity';
import { Tenant } from '../src/tenant/tenant.entity';
import { Sucursal } from '../src/sucursales/sucursal.entity';
import { User } from '../src/users/user.entity';

describe('Ventas Integration Tests (Pruebas de Integración)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let authToken: string;
  let tenantId: string;
  let sucursalId: string;
  let productoId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Limpiar y preparar base de datos para la prueba de integración
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    // Crear un Tenant de prueba
    const tenant = queryRunner.manager.create(Tenant, {
      name: 'Integration Shop',
      domain: 'integration-shop',
      email: 'integration@shop.com',
      password: 'integration-password',
      status: 'APPROVED',
      isActive: true,
      ubicacion: 'Calle Integracion #1',
      nit: '11111111',
      razonSocial: 'Integration Shop S.A.',
    });
    const savedTenant = await queryRunner.manager.save(Tenant, tenant);
    tenantId = savedTenant.id;

    // Crear una sucursal
    const sucursal = queryRunner.manager.create(Sucursal, {
      tenant_id: tenantId,
      name: 'Central Integration',
      address: 'Central address',
      phone: '77777777',
      isActive: true,
    });
    const savedSucursal = await queryRunner.manager.save(Sucursal, sucursal);
    sucursalId = savedSucursal.id;

    // Crear un producto
    const producto = queryRunner.manager.create(Producto, {
      tenant_id: tenantId,
      name: 'Producto Integrado',
      sku: 'SKU-INT-1',
      precioCosto: 50,
      precioVenta: 100,
      category: 'Otros',
      stockMinimo: 5,
      proveedor_id: null,
    });
    const savedProducto = await queryRunner.manager.save(Producto, producto);
    productoId = savedProducto.id;

    // Crear Stock para ese producto en esa sucursal
    const stock = queryRunner.manager.create(Stock, {
      tenant_id: tenantId,
      sucursal_id: sucursalId,
      producto_id: productoId,
      cantidadTotal: 10,
      valorAdquisicion: 500,
    });
    await queryRunner.manager.save(Stock, stock);

    // Crear un usuario administrador del Tenant para autenticarnos
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('password123', 10);
    const user = queryRunner.manager.create(User, {
      tenant_id: tenantId,
      name: 'Integration Admin',
      email: 'integration-admin@shop.com',
      password: hashedPassword,
      role: 'OWNER',
      isActive: true,
    });
    await queryRunner.manager.save(User, user);
    await queryRunner.release();

    // Obtener Token de autenticación
    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'integration-admin@shop.com', password: 'password123' });

    authToken = loginRes.body.access_token;
  });

  afterAll(async () => {
    // Limpieza
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.query('DELETE FROM stock WHERE tenant_id = $1', [
      tenantId,
    ]);
    await queryRunner.query('DELETE FROM ventas WHERE tenant_id = $1', [
      tenantId,
    ]);
    await queryRunner.query('DELETE FROM productos WHERE tenant_id = $1', [
      tenantId,
    ]);
    await queryRunner.query('DELETE FROM sucursales WHERE tenant_id = $1', [
      tenantId,
    ]);
    await queryRunner.query('DELETE FROM users WHERE tenant_id = $1', [
      tenantId,
    ]);
    await queryRunner.query('DELETE FROM tenants WHERE id = $1', [tenantId]);
    await queryRunner.release();
    await app.close();
  });

  describe('GET /api/ventas/siguiente-numero/:sucursalId (Sencilla)', () => {
    it('debería obtener el siguiente correlativo (000001) para la sucursal vacía', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/ventas/siguiente-numero/${sucursalId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.nextNumber).toBe('000001');
    });
  });

  describe('POST /api/ventas (Compleja)', () => {
    it('debería fallar si se intenta vender un producto sin suficiente stock', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ventas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sucursal_id: sucursalId,
          clienteNombre: 'Cliente Prueba',
          clienteDocumento: '1234567',
          metodoPago: 'Efectivo',
          items: [
            { producto_id: productoId, cantidad: 15 }, // Disponible 10
          ],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Stock insuficiente');
    });

    it('debería completar una venta exitosa, descontar stock de DB y generar factura correlativa', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/ventas')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          sucursal_id: sucursalId,
          clienteNombre: 'Cliente Prueba',
          clienteDocumento: '1234567',
          metodoPago: 'Efectivo',
          items: [
            { producto_id: productoId, cantidad: 4 }, // Disponible 10
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.numeroComprobante).toBe('FAC-000001');
      expect(Number(res.body.total)).toBe(400); // 4 * 100 precioVenta

      // Verificar que el stock se descontó en la base de datos
      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      const updatedStock = await queryRunner.manager.findOne(Stock, {
        where: {
          tenant_id: tenantId,
          sucursal_id: sucursalId,
          producto_id: productoId,
        },
      });
      expect(updatedStock.cantidadTotal).toBe(6); // 10 - 4 = 6
      await queryRunner.release();

      // Verificar que el siguiente correlativo cambió a 000002
      const nextRes = await request(app.getHttpServer())
        .get(`/api/ventas/siguiente-numero/${sucursalId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(nextRes.status).toBe(200);
      expect(nextRes.body.nextNumber).toBe('000002');
    });
  });
});
