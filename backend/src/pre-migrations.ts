// @ts-ignore
import { Client } from 'pg';

export async function runPreMigrations() {
  const connectionString = process.env.DATABASE_URL;
  const client = new Client(
    connectionString
      ? {
          connectionString,
          ssl: { rejectUnauthorized: false },
        }
      : {
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 5432,
          user: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || '1234',
          database: process.env.DB_DATABASE || 'mall_db',
        }
  );

  const renames = [
    // users
    ['users', 'password', 'password_hash'],
    ['users', 'isActive', 'is_active'],
    ['users', 'createdAt', 'created_at'],
    ['users', 'updatedAt', 'updated_at'],

    // tenants
    ['tenants', 'razonSocial', 'razon_social'],
    ['tenants', 'logoUrl', 'logo_url'],
    ['tenants', 'bannerUrl', 'banner_url'],
    ['tenants', 'brandColor', 'brand_color'],
    ['tenants', 'isActive', 'is_active'],
    ['tenants', 'createdAt', 'created_at'],
    ['tenants', 'updatedAt', 'updated_at'],

    // clientes
    ['clientes', 'isActive', 'is_active'],
    ['clientes', 'createdAt', 'created_at'],
    ['clientes', 'updatedAt', 'updated_at'],

    // proveedores
    ['proveedores', 'contactEmail', 'contact_email'],
    ['proveedores', 'taxId', 'tax_id'],
    ['proveedores', 'createdAt', 'created_at'],
    ['proveedores', 'updatedAt', 'updated_at'],

    // productos
    ['productos', 'stockMinimo', 'stock_minimo'],
    ['productos', 'precioCosto', 'precio_costo'],
    ['productos', 'precioVenta', 'precio_venta'],
    ['productos', 'createdAt', 'created_at'],
    ['productos', 'updatedAt', 'updated_at'],

    // lotes_ingreso
    ['lotes_ingreso', 'costoUnitarioSnapshot', 'costo_unitario_snapshot'],
    ['lotes_ingreso', 'fechaElaboracion', 'fecha_elaboracion'],
    ['lotes_ingreso', 'fechaVencimiento', 'fecha_vencimiento'],
    ['lotes_ingreso', 'fechaIngreso', 'fecha_ingreso'],

    // stock
    ['stock', 'cantidadTotal', 'cantidad_total'],
    ['stock', 'valorAdquisicion', 'valor_adquisicion'],
    ['stock', 'ultimaActualizacion', 'ultima_actualizacion'],

    // sucursales
    ['sucursales', 'isActive', 'is_active'],
    ['sucursales', 'createdAt', 'created_at'],
    ['sucursales', 'updatedAt', 'updated_at'],

    // ventas
    ['ventas', 'numeroComprobante', 'numero_comprobante'],
    ['ventas', 'clienteNombre', 'cliente_name'],
    ['ventas', 'clienteDocumento', 'cliente_documento'],
    ['ventas', 'costoTotal', 'costo_total'],
    ['ventas', 'utilidadTotal', 'utilidad_total'],
    ['ventas', 'metodoPago', 'metodo_pago'],
    ['ventas', 'montoRecibido', 'monto_recibido'],
    ['ventas', 'vendedorNombre', 'vendedor_nombre'],

    // venta_detalles
    ['venta_detalles', 'skuSnapshot', 'sku_snapshot'],
    ['venta_detalles', 'nombreProductoSnapshot', 'nombre_producto_snapshot'],
    ['venta_detalles', 'precioUnitarioSnapshot', 'precio_unitario_snapshot'],
    ['venta_detalles', 'costoUnitarioSnapshot', 'costo_unitario_snapshot'],
    ['venta_detalles', 'createdAt', 'created_at'],
  ];

  try {
    await client.connect();
    console.log('Running pre-startup column renaming migrations...');

    for (const [table, oldCol, newCol] of renames) {
      // check if old column exists
      const checkRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [table, oldCol]);

      if (checkRes.rowCount > 0) {
        console.log(`Pre-migration: Renaming ${table}.${oldCol} to ${newCol}...`);
        await client.query(`ALTER TABLE "${table}" RENAME COLUMN "${oldCol}" TO "${newCol}"`);
      }
    }

    // Also drop password column from tenants if it exists
    const checkTenantPass = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'tenants' AND column_name = 'password'
    `);
    if (checkTenantPass.rowCount > 0) {
      console.log('Pre-migration: Dropping tenants.password column...');
      await client.query('ALTER TABLE "tenants" DROP COLUMN "password"');
    }

    // Also drop ventas.detalle column if it exists
    const checkVentasDetalle = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ventas' AND column_name = 'detalle'
    `);
    if (checkVentasDetalle.rowCount > 0) {
      console.log('Pre-migration: Dropping ventas.detalle column...');
      await client.query('ALTER TABLE "ventas" DROP COLUMN "detalle"');
    }

    console.log('Pre-startup migrations completed successfully.');
  } catch (error) {
    console.error('Error running pre-startup migrations:', error);
  } finally {
    await client.end();
  }
}
