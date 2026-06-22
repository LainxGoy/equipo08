import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from '../auth/jwt.strategy';
import { AuthService } from '../auth/auth.service';
import { VentasService } from './ventas.service';
import { TenantStatus } from '../tenant/tenant.entity';
import { Stock } from '../stock/stock.entity';

describe('Sistema BolClick - Pruebas Unitarias de Reglas de Negocio y Servicios', () => {
  // MÓDULO 1: REGLAS DE NEGOCIO DE VENTAS E INVENTARIO (VentasService)
  describe('VentasService (Reglas de Inventario)', () => {
    let service: VentasService;
    let mockVentaRep: any;
    let mockProductoRep: any;
    let mockStockService: any;
    let mockDataSource: any;

    beforeEach(() => {
      mockVentaRep = {
        count: jest.fn(),
        create: jest.fn(),
        save: jest.fn(),
        findOne: jest.fn().mockResolvedValue({
          id: 'venta-1',
          numeroComprobante: 'FAC-000001',
          fecha: new Date(),
          detail: [],
          total: 100,
          costoTotal: 60,
          utilidadTotal: 40,
          metodoPago: 'Efectivo',
          montoRecibido: 100,
          cambio: 0,
          vendedorNombre: 'Sistema',
          sucursal: { name: 'Sucursal Test' },
        }),
      };
      mockProductoRep = {};
      mockStockService = {
        applyStockDelta: jest.fn(),
      };
      mockDataSource = {
        createQueryRunner: jest.fn().mockReturnValue({
          connect: jest.fn(),
          startTransaction: jest.fn(),
          commitTransaction: jest.fn(),
          rollbackTransaction: jest.fn(),
          release: jest.fn(),
          manager: {
            findOne: jest.fn(),
            count: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        }),
      };

      service = new VentasService(
        mockVentaRep,
        mockProductoRep,
        mockStockService,
        mockDataSource,
      );
      jest.spyOn(service, 'generatePdf').mockResolvedValue('mock.pdf');
    });

    // PRUEBA 1: Regla de Correlativos Secuenciales
    it('1. [Regla de Negocio] getSiguienteNumero - Debe generar número correlativo rellenado con 6 ceros', async () => {
      mockVentaRep.count.mockResolvedValue(4);
      const result = await service.getSiguienteNumero('tenant-1', 'branch-1');
      expect(result).toBe('000005');
    });

    // PRUEBA 2: Restricción por tienda y sucursal en correlativos
    it('2. [Regla de Negocio] getSiguienteNumero - Debe filtrar la búsqueda estrictamente por tenant_id y sucursal_id', async () => {
      mockVentaRep.count.mockResolvedValue(0);
      await service.getSiguienteNumero('my-tenant', 'my-branch');
      expect(mockVentaRep.count).toHaveBeenCalledWith({
        where: { tenant_id: 'my-tenant', sucursal_id: 'my-branch' },
      });
    });

    // PRUEBA 3: Validación de stock en venta (Suficiencia de inventario)
    it('3. [Regla de Negocio] create - Debe fallar si la cantidad de venta supera la disponible en Stock', async () => {
      const runner = mockDataSource.createQueryRunner();
      runner.manager.findOne.mockImplementation(
        (entity: any, criteria: any) => {
          if (criteria.where.id === 'prod-1') {
            return Promise.resolve({
              id: 'prod-1',
              name: 'Zapatos',
              precioVenta: 100,
              precioCosto: 60,
            });
          }
          return Promise.resolve({
            id: 'stock-1',
            cantidadTotal: 2,
            valorAdquisicion: 120,
          });
        },
      );

      const dto = {
        sucursal_id: 'branch-1',
        clienteNombre: 'Carlos',
        clienteDocumento: '123',
        items: [{ producto_id: 'prod-1', cantidad: 5 }],
      };

      await expect(service.create(dto as any, 'tenant-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    // PRUEBA 4: Procesamiento exitoso y reducción de stock
    it('4. [Regla de Negocio] create - Debe guardar la venta y reducir el stock disponible si hay suficiencia', async () => {
      const runner = mockDataSource.createQueryRunner();
      const mockProduct = {
        id: 'prod-1',
        name: 'Zapatos',
        precioVenta: 100,
        precioCosto: 60,
      };
      const mockStock = {
        id: 'stock-1',
        sucursal_id: 'branch-1',
        producto_id: 'prod-1',
        cantidadTotal: 10,
        valorAdquisicion: 600,
      };
      const mockSavedVenta = {
        id: 'venta-1',
        total: 100,
        numeroComprobante: 'FAC-000001',
        detalle: [],
      };
      runner.manager.findOne
        .mockResolvedValueOnce(mockProduct)
        .mockResolvedValueOnce(mockStock);
      runner.manager.count.mockResolvedValue(0); // Para generar número de factura
      runner.manager.create.mockReturnValue(mockSavedVenta);
      runner.manager.save.mockResolvedValue(mockSavedVenta);
      mockStockService.applyStockDelta.mockImplementation(
        async (manager, tenant_id, sucursal_id, producto_id, cantidad, valorDelta) => {
          mockStock.cantidadTotal += cantidad;
          mockStock.valorAdquisicion += valorDelta;
          await manager.save(Stock, mockStock);
          return mockStock;
        }
      );

      const dto = {
        sucursal_id: 'branch-1',
        clienteNombre: 'Carlos',
        clienteDocumento: '123',
        items: [{ producto_id: 'prod-1', cantidad: 2 }],
      };
      const result = await service.create(dto as any, 'tenant-1');
      expect(result.id).toBe('venta-1');
      expect(mockStock.cantidadTotal).toBe(8);
      expect(runner.manager.save).toHaveBeenCalledWith(
        expect.anything(),
        mockStock,
      );
    });
  });

  // MÓDULO 2: SEGURIDAD Y ACCESOS (JwtStrategy - Reglas de Negocio de Guardias)
  describe('JwtStrategy (Verificación de Cuentas y Bloqueos)', () => {
    let strategy: JwtStrategy;
    let mockUserRep: any;

    beforeEach(() => {
      mockUserRep = {
        findOne: jest.fn(),
      };
      const mockDataSource = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue(null),
        }),
      };
      strategy = new JwtStrategy(mockUserRep, mockDataSource as any);
    });

    // PRUEBA 5: Verificación de Usuario Activo
    it('5. [Regla de Negocio] validate - Debe arrojar error si el usuario está inactivo', async () => {
      mockUserRep.findOne.mockResolvedValue({ id: 'user-1', isActive: false });

      const payload = { sub: 'user-1', tenantId: 't-1', role: 'VENDEDOR' };
      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('USER_DISABLED'),
      );
    });

    // PRUEBA 6: Verificación de Estado de Tienda Suspended
    it('6. [Regla de Negocio] validate - Debe arrojar error si la tienda (tenant) está SUSPENDIDA', async () => {
      mockUserRep.findOne.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        tenant_id: 't-1',
      });

      // Mock DataSource para devolver tenant suspendido
      const mockDataSource = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn().mockResolvedValue({ id: 't-1', status: TenantStatus.SUSPENDED }),
        }),
      };
      strategy = new JwtStrategy(mockUserRep, mockDataSource as any);

      const payload = { sub: 'user-1', tenantId: 't-1', role: 'VENDEDOR' };
      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('TENANT_BLOCKED'),
      );
    });

    // PRUEBA 7: Control de cambio de sucursal asignada
    it('7. [Regla de Negocio] validate - Debe lanzar BRANCH_CHANGED si el token del empleado tiene una sucursal distinta a la actual', async () => {
      mockUserRep.findOne.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        sucursal_id: 'branch-actual',
      });

      const payload = {
        sub: 'user-1',
        tenantId: 't-1',
        role: 'VENDEDOR',
        sucursal_id: 'branch-antigua',
      };
      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('BRANCH_CHANGED'),
      );
    });

    // PRUEBA 8: Control de Sucursal Inactiva
    it('8. [Regla de Negocio] validate - Debe lanzar BRANCH_DISABLED si la sucursal del empleado ha sido desactivada', async () => {
      mockUserRep.findOne.mockResolvedValue({
        id: 'user-1',
        isActive: true,
        sucursal_id: 'branch-1',
        sucursal: { id: 'branch-1', isActive: false },
      });

      const payload = {
        sub: 'user-1',
        tenantId: 't-1',
        role: 'VENDEDOR',
        sucursal_id: 'branch-1',
      };
      await expect(strategy.validate(payload)).rejects.toThrow(
        new UnauthorizedException('BRANCH_DISABLED'),
      );
    });
  });

  // MÓDULO 3: AUTENTICACIÓN Y MIGRACIONES DE REGISTRO (AuthService)
  describe('AuthService (Servicios de Acceso)', () => {
    let authService: AuthService;
    let mockTenantRep: any;
    let mockJwtService: any;
    let mockUsersService: any;
    let mockMailService: any;
    let mockDataSource: any;

    beforeEach(() => {
      mockTenantRep = {};
      mockJwtService = {};
      mockUsersService = {};
      mockMailService = {};
      mockDataSource = {
        getRepository: jest.fn().mockReturnValue({
          findOne: jest.fn(),
        }),
      };

      authService = new AuthService(
        mockTenantRep,
        mockJwtService,
        mockUsersService,
        mockMailService,
        mockDataSource,
      );
    });

    // PRUEBA 9: Bloqueo de Tiendas Pendientes de Aprobación
    it('9. [Servicio / Regla] login - Debe lanzar error PENDING_APPROVAL si la tienda está registrada pero en revisión', async () => {
      const mockUser = {
        id: 'u-1',
        isActive: true,
        password: 'hashed-password',
        tenant_id: 't-1',
        role: 'VENDEDOR',
      };
      const mockTenantPending = { id: 't-1', status: TenantStatus.PENDING, isActive: true };

      // Mock de bcrypt.compare simulando contraseña correcta
      require('bcrypt').compare = jest.fn().mockResolvedValue(true);

      const mockFindOne = jest.fn()
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(mockTenantPending);
      mockDataSource.getRepository.mockReturnValue({ findOne: mockFindOne });

      const loginDto = { email: 'admin@tienda.com', password: 'password123' };
      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('PENDING_APPROVAL'),
      );
    });

    // PRUEBA 10: Validación de Credenciales Incorrectas
    it('10. [Servicio] login - Debe rechazar el acceso con Credenciales inválidas si la contraseña no coincide', async () => {
      const mockUser = {
        id: 'u-1',
        isActive: true,
        password: 'hashed-password',
        tenant_id: 't-1',
        role: 'VENDEDOR',
      };

      // Mock de bcrypt.compare simulando contraseña incorrecta
      require('bcrypt').compare = jest.fn().mockResolvedValue(false);

      mockDataSource.getRepository.mockReturnValue({ findOne: jest.fn().mockResolvedValue(mockUser) });

      const loginDto = { email: 'admin@tienda.com', password: 'wrongpassword' };
      await expect(authService.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Credenciales inválidas'),
      );
    });
  });
});
