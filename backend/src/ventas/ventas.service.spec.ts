import { Test, TestingModule } from '@nestjs/testing';
import { VentasService } from './ventas.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Venta } from './venta.entity';
import { Producto } from '../productos/producto.entity';
import { StockService } from '../stock/stock.service';
import { DataSource } from 'typeorm';

describe('VentasService (Prueba Unitarias Sencilla)', () => {
  let service: VentasService;
  let ventaRepositoryMock: any;

  beforeEach(async () => {
    ventaRepositoryMock = {
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        {
          provide: getRepositoryToken(Venta),
          useValue: ventaRepositoryMock,
        },
        {
          provide: getRepositoryToken(Producto),
          useValue: {},
        },
        {
          provide: StockService,
          useValue: {
            applyStockDelta: jest.fn().mockResolvedValue({ id: 'mock-stock-id', cantidadTotal: 5 }),
          },
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<VentasService>(VentasService);
  });

  it('debería estar definido el servicio', () => {
    expect(service).toBeDefined();
  });

  describe('getSiguienteNumero', () => {
    it('debería retornar el siguiente número formateado con 6 dígitos cuando el conteo de ventas es 0', async () => {
      ventaRepositoryMock.count.mockResolvedValue(0);
      const result = await service.getSiguienteNumero(
        'tenant-id',
        'sucursal-id',
      );
      expect(result).toBe('000001');
      expect(ventaRepositoryMock.count).toHaveBeenCalledWith({
        where: { tenant_id: 'tenant-id', sucursal_id: 'sucursal-id' },
      });
    });

    it('debería retornar 000016 cuando el conteo es 15', async () => {
      ventaRepositoryMock.count.mockResolvedValue(15);
      const result = await service.getSiguienteNumero(
        'tenant-id',
        'sucursal-id',
      );
      expect(result).toBe('000016');
    });
  });
});
