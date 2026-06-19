import { Test, TestingModule } from '@nestjs/testing';
import { StockService } from './stock.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Stock } from './stock.entity';
import { MovimientoInventario } from './movimiento-inventario.entity';
import { TransferenciaStock } from './transferencia-stock.entity';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

describe('StockService (Prueba Unitaria Compleja)', () => {
  let service: StockService;
  let stockRepositoryMock: any;
  let dataSourceMock: any;
  let queryRunnerMock: any;
  let managerMock: any;

  beforeEach(async () => {
    stockRepositoryMock = {
      findOne: jest.fn(),
      create: jest.fn((_entity: any, data: any) => data),
      save: jest.fn(),
      find: jest.fn(),
    };

    managerMock = {
      findOne: jest.fn(),
      create: jest.fn((_entity: any, data: any) => data),
      save: jest.fn(),
    };

    queryRunnerMock = {
      connect: jest.fn(),
      startTransaction: jest.fn(),
      commitTransaction: jest.fn(),
      rollbackTransaction: jest.fn(),
      release: jest.fn(),
      manager: managerMock,
    };

    dataSourceMock = {
      createQueryRunner: jest.fn().mockReturnValue(queryRunnerMock),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: getRepositoryToken(Stock),
          useValue: stockRepositoryMock,
        },
        {
          provide: DataSource,
          useValue: dataSourceMock,
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
  });

  it('debería estar definido el servicio de stock', () => {
    expect(service).toBeDefined();
  });

  describe('transferStock (Compleja)', () => {
    it('debería lanzar error si la sucursal de origen y destino son la misma', async () => {
      await expect(
        service.transferStock(
          'tenant-1',
          'sucursal-A',
          'sucursal-A',
          'prod-1',
          5,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería lanzar error si la cantidad es menor o igual a cero', async () => {
      await expect(
        service.transferStock(
          'tenant-1',
          'sucursal-A',
          'sucursal-B',
          'prod-1',
          0,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('debería transferir stock exitosamente descontando de origen y añadiendo a destino con transacción', async () => {
      const sourceStock = {
        tenant_id: 'tenant-1',
        sucursal_id: 'sucursal-A',
        producto_id: 'prod-1',
        cantidadTotal: 10,
        valorAdquisicion: 100,
      };

      const targetStock = {
        tenant_id: 'tenant-1',
        sucursal_id: 'sucursal-B',
        producto_id: 'prod-1',
        cantidadTotal: 2,
        valorAdquisicion: 20,
      };

      // Mockear las búsquedas de la transacción
      managerMock.findOne
        .mockResolvedValueOnce(sourceStock) // Primera llamada: origen
        .mockResolvedValueOnce(targetStock); // Segunda llamada: destino

      await service.transferStock(
        'tenant-1',
        'sucursal-A',
        'sucursal-B',
        'prod-1',
        5,
      );

      // Verificaciones del QueryRunner y Transacción
      expect(dataSourceMock.createQueryRunner).toHaveBeenCalled();
      expect(queryRunnerMock.connect).toHaveBeenCalled();
      expect(queryRunnerMock.startTransaction).toHaveBeenCalled();

      // Verificación de descuento en origen (10 - 5 = 5)
      expect(sourceStock.cantidadTotal).toBe(5);
      // Costo unitario promedio = 100 / 10 = 10. Valor transferido = 10 * 5 = 50. Nuevo valor = 100 - 50 = 50
      expect(sourceStock.valorAdquisicion).toBe(50);

      // Verificación de incremento en destino (2 + 5 = 7)
      expect(targetStock.cantidadTotal).toBe(7);
      expect(targetStock.valorAdquisicion).toBe(70); // 20 + 50 = 70

      // Guardados en la transacción: origen, destino, cabecera de transferencia y dos movimientos.
      expect(managerMock.save).toHaveBeenCalledTimes(5);
      expect(managerMock.save).toHaveBeenCalledWith(
        TransferenciaStock,
        expect.objectContaining({
          tenant_id: 'tenant-1',
          from_sucursal_id: 'sucursal-A',
          to_sucursal_id: 'sucursal-B',
          producto_id: 'prod-1',
          cantidad: 5,
        }),
      );
      expect(managerMock.save).toHaveBeenCalledWith(
        MovimientoInventario,
        expect.objectContaining({
          sucursal_id: 'sucursal-A',
          cantidad_delta: -5,
        }),
      );
      expect(managerMock.save).toHaveBeenCalledWith(
        MovimientoInventario,
        expect.objectContaining({
          sucursal_id: 'sucursal-B',
          cantidad_delta: 5,
        }),
      );
      expect(queryRunnerMock.commitTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });

    it('debería hacer rollback si ocurre un error inesperado durante la transacción', async () => {
      managerMock.findOne.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        service.transferStock(
          'tenant-1',
          'sucursal-A',
          'sucursal-B',
          'prod-1',
          5,
        ),
      ).rejects.toThrow('DB connection lost');

      expect(queryRunnerMock.rollbackTransaction).toHaveBeenCalled();
      expect(queryRunnerMock.release).toHaveBeenCalled();
    });
  });
});
