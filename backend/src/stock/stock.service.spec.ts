import { BadRequestException } from '@nestjs/common';
import { StockService } from './stock.service';
import { Stock } from './stock.entity';

/**
 * Suite de Pruebas: Transacciones, Rollback, Bloqueo de Stock y Multi-Tenant
 * ============================================================================
 * Estas pruebas verifican las reglas críticas de producción del módulo de inventario.
 */
describe('StockService - Pruebas de Producción', () => {
  let service: StockService;
  let mockStockRep: any;
  let mockDataSource: any;

  // Mock de un EntityManager reutilizable
  const createMockManager = () => ({
    findOne: jest.fn((entity: any, options: any) => {
      // Mock para la búsqueda de variaciones en resolveVariacionId
      if (entity.name === 'ProductoVariacion') {
        return Promise.resolve({ id: 'generated-id' });
      }
      return Promise.resolve(null);
    }),
    create: jest.fn((entity: any, data: any) => ({ ...data })),
    save: jest.fn((entity: any, data: any) => Promise.resolve({ id: 'generated-id', ...data })),
  });

  beforeEach(() => {
    mockStockRep = {
      findOne: jest.fn((options: any) => {
        return Promise.resolve(null);
      }),
      manager: createMockManager(),
    };
    mockDataSource = {
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: createMockManager(),
      }),
    };

    service = new StockService(mockStockRep, mockDataSource);
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULO 1: TRANSACCIONES Y CONSISTENCIA
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Transacciones y Consistencia', () => {

    it('11. [Transacción] applyStockDelta - Debe crear stock Y movimiento en la misma transacción', async () => {
      const manager = createMockManager();
      manager.findOne.mockResolvedValue(null); // No existe stock previo

      const result = await service.applyStockDelta(
        manager, 'tenant-1', 'suc-1', 'prod-1',
        10, 500, 'INGRESO', 'Lote inicial',
      );

      // Verificar que se guardaron las entidades en el mismo manager (3 llamadas en total por la ProductoVariacion de emergencia)
      expect(manager.save).toHaveBeenCalledTimes(3); // Variacion + Stock + MovimientoInventario
      expect(result.cantidadActual).toBe(10);
      expect(result.costoPromedio).toBe(50); // 500/10
    });

    it('12. [Transacción] applyStockDelta - Debe registrar movimiento con stock_anterior y stock_resultante correctos', async () => {
      const manager = createMockManager();
      const stockExistente = {
        id: 'stock-1', tenant_id: 'tenant-1', sucursal_id: 'suc-1',
        producto_id: 'prod-1', cantidadActual: 20, costoPromedio: 50,
      };

      await service.applyStockDelta(
        manager, 'tenant-1', 'suc-1', 'prod-1',
        -5, -250, 'EGRESO', 'Venta FAC-000001',
        stockExistente as any,
      );

      // Verificar que el movimiento registra stockAnterior=20 y stockResultante=15
      const movimientoCall = manager.save.mock.calls[1]; // Segunda llamada = movimiento
      const movimientoData = movimientoCall[1];
      expect(movimientoData.stockAnterior).toBe(20);
      expect(movimientoData.stockResultante).toBe(15);
      expect(movimientoData.cantidadDelta).toBe(-5);
      expect(movimientoData.tipo).toBe('EGRESO');
    });

    it('13. [Transacción] applyStockDelta - Debe calcular WAC correctamente en entradas', async () => {
      const manager = createMockManager();
      // Stock existente: 10 unidades a Bs 50 c/u = Bs 500 total
      const stockExistente = {
        id: 'stock-1', tenant_id: 'tenant-1', sucursal_id: 'suc-1',
        producto_id: 'prod-1', cantidadActual: 10, costoPromedio: 50,
      };

      await service.applyStockDelta(
        manager, 'tenant-1', 'suc-1', 'prod-1',
        5, 400, 'INGRESO', 'Nuevo lote', // 5 unidades a Bs 80 c/u = Bs 400
        stockExistente as any,
      );

      // WAC = (10*50 + 400) / 15 = 900/15 = 60
      expect(stockExistente.costoPromedio).toBe(60);
      expect(stockExistente.cantidadActual).toBe(15);
    });

    it('14. [Transacción] applyStockDelta - En salidas el costoPromedio se mantiene', async () => {
      const manager = createMockManager();
      const stockExistente = {
        id: 'stock-1', tenant_id: 'tenant-1', sucursal_id: 'suc-1',
        producto_id: 'prod-1', cantidadActual: 20, costoPromedio: 75,
      };

      await service.applyStockDelta(
        manager, 'tenant-1', 'suc-1', 'prod-1',
        -8, -600, 'EGRESO', 'Venta',
        stockExistente as any,
      );

      // En salidas, el costo promedio NO cambia
      expect(stockExistente.costoPromedio).toBe(75);
      expect(stockExistente.cantidadActual).toBe(12);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULO 2: BLOQUEO DE STOCK (SOBREVENTA)
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Bloqueo de Stock - Anti-Sobreventa', () => {

    it('15. [Bloqueo] applyStockDelta - Debe rechazar si el stock quedaría negativo', async () => {
      const manager = createMockManager();
      const stockExistente = {
        id: 'stock-1', tenant_id: 'tenant-1', sucursal_id: 'suc-1',
        producto_id: 'prod-1', cantidadActual: 3, costoPromedio: 50,
      };

      await expect(
        service.applyStockDelta(
          manager, 'tenant-1', 'suc-1', 'prod-1',
          -5, -250, 'EGRESO', 'Venta que excede stock',
          stockExistente as any,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('16. [Bloqueo] applyStockDelta - Debe permitir venta exacta al stock disponible (stock=0 final)', async () => {
      const manager = createMockManager();
      const stockExistente = {
        id: 'stock-1', tenant_id: 'tenant-1', sucursal_id: 'suc-1',
        producto_id: 'prod-1', cantidadActual: 5, costoPromedio: 50,
      };

      await service.applyStockDelta(
        manager, 'tenant-1', 'suc-1', 'prod-1',
        -5, -250, 'EGRESO', 'Venta exacta',
        stockExistente as any,
      );

      expect(stockExistente.cantidadActual).toBe(0);
    });

    it('17. [Bloqueo] applyStockDelta - Debe rechazar -1 cuando stock es 0', async () => {
      const manager = createMockManager();
      const stockExistente = {
        id: 'stock-1', tenant_id: 'tenant-1', sucursal_id: 'suc-1',
        producto_id: 'prod-1', cantidadActual: 0, costoPromedio: 50,
      };

      await expect(
        service.applyStockDelta(
          manager, 'tenant-1', 'suc-1', 'prod-1',
          -1, -50, 'EGRESO', 'Venta imposible',
          stockExistente as any,
        ),
      ).rejects.toThrow('El stock no puede quedar negativo');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULO 3: ROLLBACK EN TRANSACCIONES
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Rollback en Transacciones', () => {

    it('18. [Rollback] transferStock - Debe hacer rollback si sucursal origen no tiene stock suficiente', async () => {
      const runner = mockDataSource.createQueryRunner();
      runner.manager.findOne.mockResolvedValue({
        id: 'stock-1', cantidadActual: 2, costoPromedio: 50,
      });

      await expect(
        service.transferStock('tenant-1', 'suc-origen', 'suc-destino', 'prod-1', 5),
      ).rejects.toThrow(BadRequestException);

      expect(runner.rollbackTransaction).toHaveBeenCalled();
      expect(runner.release).toHaveBeenCalled();
      expect(runner.commitTransaction).not.toHaveBeenCalled();
    });

    it('19. [Rollback] transferStock - Debe rechazar si origen y destino son la misma sucursal (sin abrir transacción)', async () => {
      const runner = mockDataSource.createQueryRunner();

      await expect(
        service.transferStock('tenant-1', 'suc-1', 'suc-1', 'prod-1', 5),
      ).rejects.toThrow('No se puede transferir a la misma sucursal');

      // Fail-fast: la validación ocurre ANTES de startTransaction
      expect(runner.startTransaction).not.toHaveBeenCalled();
      expect(runner.commitTransaction).not.toHaveBeenCalled();
    });

    it('20. [Rollback] transferStock - Debe rechazar cantidad 0 o negativa (sin abrir transacción)', async () => {
      const runner = mockDataSource.createQueryRunner();

      await expect(
        service.transferStock('tenant-1', 'suc-1', 'suc-2', 'prod-1', 0),
      ).rejects.toThrow('La cantidad debe ser mayor a cero');

      // Fail-fast: la validación ocurre ANTES de startTransaction
      expect(runner.startTransaction).not.toHaveBeenCalled();
    });

    it('21. [Rollback] transferStock - Debe hacer rollback si no existe stock en origen', async () => {
      const runner = mockDataSource.createQueryRunner();
      runner.manager.findOne.mockResolvedValue(null);

      await expect(
        service.transferStock('tenant-1', 'suc-1', 'suc-2', 'prod-1', 5),
      ).rejects.toThrow(BadRequestException);

      expect(runner.rollbackTransaction).toHaveBeenCalled();
      expect(runner.commitTransaction).not.toHaveBeenCalled();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // MÓDULO 4: AISLAMIENTO MULTI-TENANT
  // ═══════════════════════════════════════════════════════════════════════════
  describe('Aislamiento Multi-Tenant', () => {

    it('22. [Multi-Tenant] getStockRow - Debe filtrar siempre por tenant_id', async () => {
      mockStockRep.findOne.mockResolvedValue(null);

      await service.getStockRow('tenant-A', 'suc-1', 'prod-1');

      expect(mockStockRep.findOne).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-A', sucursal_id: 'suc-1', producto_variacion_id: 'generated-id' },
      });
    });

    it('23. [Multi-Tenant] getStockByTenant - Debe devolver solo stock del tenant solicitado', async () => {
      mockStockRep.find = jest.fn().mockResolvedValue([]);

      await service.getStockByTenant('tenant-B');

      expect(mockStockRep.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenant_id: 'tenant-B' },
        }),
      );
    });

    it('24. [Multi-Tenant] applyStockDelta - Debe crear stock con tenant_id correcto', async () => {
      const manager = createMockManager();

      await service.applyStockDelta(
        manager, 'tenant-X', 'suc-1', 'prod-1',
        10, 500, 'INGRESO', 'Primer lote',
      );

      // El stock creado debe tener el tenant_id correcto
      const stockCreateCall = manager.create.mock.calls[0];
      const stockData = stockCreateCall[1];
      expect(stockData.tenant_id).toBe('tenant-X');

      // El movimiento también debe tener el tenant_id correcto
      const movCreateCall = manager.create.mock.calls[1];
      const movData = movCreateCall[1];
      expect(movData.tenant_id).toBe('tenant-X');
    });

    it('25. [Multi-Tenant] applyStockDelta - Debe buscar stock filtrando por tenant_id', async () => {
      const manager = createMockManager();

      await service.applyStockDelta(
        manager, 'tenant-Z', 'suc-1', 'prod-1',
        5, 100, 'INGRESO', 'Test',
      );

      expect(manager.findOne).toHaveBeenCalledWith(Stock, {
        where: { tenant_id: 'tenant-Z', sucursal_id: 'suc-1', producto_variacion_id: 'generated-id' },
      });
    });

    it('26. [Multi-Tenant] transferStock - Debe respetar tenant_id en origen y destino', async () => {
      const runner = mockDataSource.createQueryRunner();
      const mockSourceStock = {
        id: 'stock-1', cantidadActual: 20, costoPromedio: 50,
      };
      
      // La primera llamada resolverá la variación y retornará su mock
      runner.manager.findOne
        .mockResolvedValueOnce({ id: 'generated-id' }) // resolveVariacionId call
        .mockResolvedValueOnce(mockSourceStock)       // stock origen con lock
        .mockResolvedValueOnce(null);                 // stock destino no existe

      // Mock applyStockDelta para que no falle
      jest.spyOn(service, 'applyStockDelta').mockResolvedValue(mockSourceStock as any);

      await service.transferStock('tenant-AISLADO', 'suc-1', 'suc-2', 'prod-1', 5);

      // Verificar que findOne del origen filtró por tenant_id y producto_variacion_id
      expect(runner.manager.findOne).toHaveBeenNthCalledWith(2, Stock, {
        where: { tenant_id: 'tenant-AISLADO', sucursal_id: 'suc-1', producto_variacion_id: 'generated-id' },
        lock: { mode: 'pessimistic_write' },
      });

      expect(runner.commitTransaction).toHaveBeenCalled();
    });
  });
});
