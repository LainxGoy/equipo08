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
    ['lotes_ingreso', 'costoUnitarioSnapshot', 'costo_unitario'],
    ['lotes_ingreso', 'costo_unitario_snapshot', 'costo_unitario'],
    ['lotes_ingreso', 'fechaElaboracion', 'fecha_elaboracion'],
    ['lotes_ingreso', 'fechaVencimiento', 'fecha_vencimiento'],
    ['lotes_ingreso', 'fechaIngreso', 'fecha_ingreso'],

    // stock
    ['stock', 'cantidadTotal', 'cantidad_actual'],
    ['stock', 'cantidad_total', 'cantidad_actual'],
    ['stock', 'valorAdquisicion', 'costo_promedio'],
    ['stock', 'valor_adquisicion', 'costo_promedio'],
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

    // movimientos_inventario
    ['movimientos_inventario', 'cantidad', 'cantidad_delta'],
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
    // Check if stock_id column exists in ajustes_inventario. 
    // If it doesn't exist, we add it as a nullable column first so we can populate it before TypeORM tries to sync it as NOT NULL.
    const checkStockIdCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'ajustes_inventario' AND column_name = 'stock_id'
    `);
    if (checkStockIdCol.rowCount === 0) {
      console.log('Pre-migration: Adding temporary nullable stock_id to ajustes_inventario...');
      await client.query('ALTER TABLE "ajustes_inventario" ADD COLUMN "stock_id" uuid NULL');
    }

    // Only attempt to populate stock_id if sucursal_id and producto_id columns still exist in the database table
    const checkSucursalCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'ajustes_inventario' AND column_name = 'sucursal_id'
    `);
    const checkProductoCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'ajustes_inventario' AND column_name = 'producto_id'
    `);

    let pendingAjustes: { rows: any[] } = { rows: [] };
    if (checkSucursalCol.rowCount > 0 && checkProductoCol.rowCount > 0) {
      pendingAjustes = await client.query(`
        SELECT id, tenant_id, sucursal_id, producto_id 
        FROM ajustes_inventario 
        WHERE stock_id IS NULL
      `);
    }

    for (const row of pendingAjustes.rows) {
      // Emergency defaults for tenant_id and sucursal_id if they are null/empty in the old record
      let tenantId = row.tenant_id;
      if (!tenantId) {
        const anyTenant = await client.query('SELECT id FROM tenants LIMIT 1');
        tenantId = anyTenant.rowCount > 0 ? anyTenant.rows[0].id : null;
      }
      const sucursalId = row.sucursal_id || null;
      const productoId = row.producto_id;

      if (!tenantId || !productoId) {
        console.warn(`Pre-migration warning: Skipping row ${row.id} because tenant_id or producto_id is missing.`);
        continue;
      }

      // Check if product exists in database first
      const prodCheck = await client.query('SELECT id FROM productos WHERE id = $1', [productoId]);
      if (prodCheck.rowCount === 0) {
        console.warn(`Pre-migration warning: Product ${productoId} does not exist for ajuste ${row.id}. Deleting adjustment record.`);
        await client.query('DELETE FROM ajustes_inventario WHERE id = $1', [row.id]);
        continue;
      }

      // Find matching stock id
      const stockRes = await client.query(`
        SELECT id FROM stock 
        WHERE tenant_id = $1 AND (sucursal_id = $2 OR (sucursal_id IS NULL AND $2 IS NULL)) AND producto_id = $3
      `, [tenantId, sucursalId, productoId]);

      let stockId = '';
      if (stockRes.rowCount > 0) {
        stockId = stockRes.rows[0].id;
      } else {
        // Create stock record dynamically to keep database integrity
        const insertStock = await client.query(`
          INSERT INTO stock (id, tenant_id, sucursal_id, producto_id, cantidad_actual, costo_promedio, ultima_actualizacion)
          VALUES (gen_random_uuid(), $1, $2, $3, 0, 0, NOW())
          RETURNING id
        `, [tenantId, sucursalId, productoId]);
        stockId = insertStock.rows[0].id;
      }

      await client.query(`
        UPDATE ajustes_inventario 
        SET stock_id = $1 
        WHERE id = $2
      `, [stockId, row.id]);
      console.log(`Pre-migration: Associated stock_id ${stockId} with ajuste_inventario ${row.id}`);
    }

    // Clean up any stray ajustes_inventario records that still have null stock_id (because they were skipped due to corrupt data, or were empty strings)
    // Also delete any record where stock_id is not present in stock table to avoid foreign key violations.
    const cleanNulls = await client.query("DELETE FROM ajustes_inventario WHERE stock_id IS NULL OR CAST(stock_id AS text) = ''");
    if (cleanNulls.rowCount > 0) {
      console.log(`Pre-migration: Deleted ${cleanNulls.rowCount} records with null/empty stock_id from ajustes_inventario.`);
    }

    const cleanOrphans = await client.query("DELETE FROM ajustes_inventario WHERE stock_id NOT IN (SELECT id FROM stock)");
    if (cleanOrphans.rowCount > 0) {
      console.log(`Pre-migration: Deleted ${cleanOrphans.rowCount} records from ajustes_inventario because their stock_id did not exist in stock table.`);
    }

    // Force stock_id to NOT NULL directly via postgres now that it is fully clean.
    // This prevents TypeORM from attempting 'ALTER COLUMN stock_id SET NOT NULL' during its sync loop since the schema is already NOT NULL.
    console.log('Pre-migration: Altering ajustes_inventario.stock_id to SET NOT NULL...');
    await client.query('ALTER TABLE "ajustes_inventario" ALTER COLUMN "stock_id" SET NOT NULL');

    // Check if stock_id column exists in lotes_ingreso. 
    // If it doesn't exist, we add it as a nullable column first so we can populate it.
    const checkLoteStockIdCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'lotes_ingreso' AND column_name = 'stock_id'
    `);
    if (checkLoteStockIdCol.rowCount === 0) {
      console.log('Pre-migration: Adding temporary nullable stock_id to lotes_ingreso...');
      await client.query('ALTER TABLE "lotes_ingreso" ADD COLUMN "stock_id" uuid NULL');
    }

    // Only attempt to populate stock_id if sucursal_id and producto_id columns still exist in the database table
    const checkLoteSucursalCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'lotes_ingreso' AND column_name = 'sucursal_id'
    `);
    const checkLoteProductoCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'lotes_ingreso' AND column_name = 'producto_id'
    `);

    let pendingLotes: { rows: any[] } = { rows: [] };
    if (checkLoteSucursalCol.rowCount > 0 && checkLoteProductoCol.rowCount > 0) {
      pendingLotes = await client.query(`
        SELECT id, tenant_id, sucursal_id, producto_id 
        FROM lotes_ingreso 
        WHERE stock_id IS NULL
      `);
    }

    for (const row of pendingLotes.rows) {
      let tenantId = row.tenant_id;
      if (!tenantId) {
        const anyTenant = await client.query('SELECT id FROM tenants LIMIT 1');
        tenantId = anyTenant.rowCount > 0 ? anyTenant.rows[0].id : null;
      }
      const sucursalId = row.sucursal_id || null;
      const productoId = row.producto_id;

      if (!tenantId || !productoId) {
        continue;
      }

      // Check if product exists in database first
      const prodCheck = await client.query('SELECT id FROM productos WHERE id = $1', [productoId]);
      if (prodCheck.rowCount === 0) {
        console.warn(`Pre-migration warning: Product ${productoId} does not exist for lote ${row.id}. Deleting lote record.`);
        await client.query('DELETE FROM lotes_ingreso WHERE id = $1', [row.id]);
        continue;
      }

      // Find matching stock id
      const stockRes = await client.query(`
        SELECT id FROM stock 
        WHERE tenant_id = $1 AND (sucursal_id = $2 OR (sucursal_id IS NULL AND $2 IS NULL)) AND producto_id = $3
      `, [tenantId, sucursalId, productoId]);

      let stockId = '';
      if (stockRes.rowCount > 0) {
        stockId = stockRes.rows[0].id;
      } else {
        // Create stock record dynamically to keep database integrity
        const insertStock = await client.query(`
          INSERT INTO stock (id, tenant_id, sucursal_id, producto_id, cantidad_actual, costo_promedio, ultima_actualizacion)
          VALUES (gen_random_uuid(), $1, $2, $3, 0, 0, NOW())
          RETURNING id
        `, [tenantId, sucursalId, productoId]);
        stockId = insertStock.rows[0].id;
      }

      await client.query(`
        UPDATE lotes_ingreso 
        SET stock_id = $1 
        WHERE id = $2
      `, [stockId, row.id]);
      console.log(`Pre-migration: Associated stock_id ${stockId} with lote_ingreso ${row.id}`);
    }

    // Clean up any stray lotes_ingreso records that still have null stock_id
    const cleanLoteNulls = await client.query("DELETE FROM lotes_ingreso WHERE stock_id IS NULL OR CAST(stock_id AS text) = ''");
    if (cleanLoteNulls.rowCount > 0) {
      console.log(`Pre-migration: Deleted ${cleanLoteNulls.rowCount} records with null/empty stock_id from lotes_ingreso.`);
    }

    const cleanLoteOrphans = await client.query("DELETE FROM lotes_ingreso WHERE stock_id NOT IN (SELECT id FROM stock)");
    if (cleanLoteOrphans.rowCount > 0) {
      console.log(`Pre-migration: Deleted ${cleanLoteOrphans.rowCount} records from lotes_ingreso because their stock_id did not exist in stock table.`);
    }

    // Force stock_id to NOT NULL directly via postgres
    console.log('Pre-migration: Altering lotes_ingreso.stock_id to SET NOT NULL...');
    await client.query('ALTER TABLE "lotes_ingreso" ALTER COLUMN "stock_id" SET NOT NULL');

    // CATEGORIAS MIGRATION STEP:
    // 1. Create table 'categorias' if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "categorias" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tenant_id" VARCHAR NOT NULL,
        "nombre" VARCHAR NOT NULL,
        "parent_id" UUID NULL REFERENCES "categorias"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_tenant_nombre" UNIQUE ("tenant_id", "nombre")
      )
    `);

    // 2. Add 'categoria_id' column to 'productos' if it doesn't exist yet
    const checkProductCatIdCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'productos' AND column_name = 'categoria_id'
    `);
    if (checkProductCatIdCol.rowCount === 0) {
      console.log('Pre-migration: Adding categoria_id column to productos...');
      await client.query('ALTER TABLE "productos" ADD COLUMN "categoria_id" UUID NULL');
    }

    // 3. Find all products that have a non-empty string 'category' but NULL 'categoria_id'
    // check if 'category' column exists first to avoid crash if it was dropped in some other version
    const checkCategoryTextCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'productos' AND column_name = 'category'
    `);
    
    if (checkCategoryTextCol.rowCount > 0) {
      const pendingProducts = await client.query(`
        SELECT id, tenant_id, category 
        FROM productos 
        WHERE categoria_id IS NULL AND category IS NOT NULL AND category != ''
      `);

      for (const row of pendingProducts.rows) {
        const catName = row.category.trim();
        // Check if category already exists in this tenant
        let catRes = await client.query(`
          SELECT id FROM categorias 
          WHERE tenant_id = $1 AND LOWER(nombre) = LOWER($2)
        `, [row.tenant_id, catName]);

        let catId = '';
        if (catRes.rowCount > 0) {
          catId = catRes.rows[0].id;
        } else {
          // Insert category
          const insertCat = await client.query(`
            INSERT INTO categorias (id, tenant_id, nombre, created_at)
            VALUES (gen_random_uuid(), $1, $2, now())
            RETURNING id
          `, [row.tenant_id, catName]);
          catId = insertCat.rows[0].id;
          console.log(`Pre-migration: Created category "${catName}" for tenant ${row.tenant_id}`);
        }

        // Update product with category ID
        await client.query(`
          UPDATE productos 
          SET categoria_id = $1 
          WHERE id = $2
        `, [catId, row.id]);
      }
    }

    // PRODUCT VARIATIONS MIGRATION STEP:
    // 1. Create table 'producto_variaciones' if it does not exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS "producto_variaciones" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "producto_id" UUID NOT NULL REFERENCES "productos"("id") ON DELETE CASCADE,
        "sku" VARCHAR NOT NULL,
        "precio_costo" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "precio_venta" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "opciones" JSONB NOT NULL DEFAULT '{}',
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_variacion_sku" UNIQUE ("sku")
      )
    `);

    // 2. Populate default variation for existing products that don't have variations yet
    const pendingProductsForVariants = await client.query(`
      SELECT p.id, p.sku, p.precio_costo, p.precio_venta, p.attributes 
      FROM productos p
      WHERE NOT EXISTS (
        SELECT 1 FROM producto_variaciones pv WHERE pv.producto_id = p.id
      )
    `);

    for (const row of pendingProductsForVariants.rows) {
      const sku = row.sku || `SKU-${row.id.split('-')[0]}`;
      const costo = row.precio_costo != null ? row.precio_costo : 0;
      const venta = row.precio_venta != null ? row.precio_venta : 0;
      const opciones = row.attributes || '{}';

      // Insert default variation
      await client.query(`
        INSERT INTO producto_variaciones (id, producto_id, sku, precio_costo, precio_venta, opciones, created_at, updated_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, now(), now())
        ON CONFLICT (sku) DO NOTHING
      `, [row.id, sku, costo, venta, typeof opciones === 'string' ? opciones : JSON.stringify(opciones)]);
      console.log(`Pre-migration: Created default variation for product "${row.id}" with SKU ${sku}`);
    }

    // STOCK VARIATIONS MIGRATION STEP:
    // 1. Add 'producto_variacion_id' column to 'stock' if it does not exist
    const checkStockVarCol = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'stock' AND column_name = 'producto_variacion_id'
    `);
    if (checkStockVarCol.rowCount === 0) {
      console.log('Pre-migration: Adding producto_variacion_id column to stock...');
      await client.query('ALTER TABLE "stock" ADD COLUMN "producto_variacion_id" UUID NULL');
    }

    // 2. Populate product_variacion_id using the default variation for each product
    const pendingStock = await client.query(`
      SELECT id, producto_id 
      FROM stock 
      WHERE producto_variacion_id IS NULL
    `);

    for (const row of pendingStock.rows) {
      const varRes = await client.query(`
        SELECT id FROM producto_variaciones 
        WHERE producto_id = $1 
        ORDER BY created_at ASC LIMIT 1
      `, [row.producto_id]);

      let varId = '';
      if (varRes.rowCount > 0) {
        varId = varRes.rows[0].id;
      } else {
        // En caso extremo que no se hubiese creado la variante por defecto (por SKU duplicado), la creamos al vuelo
        const newVarRes = await client.query(`
          INSERT INTO producto_variaciones (id, producto_id, sku, precio_costo, precio_venta, opciones, created_at, updated_at)
          VALUES (gen_random_uuid(), $1, $2, 0, 0, '{}', now(), now())
          RETURNING id
        `, [row.producto_id, `SKU-STOCK-${row.id.split('-')[0]}`]);
        varId = newVarRes.rows[0].id;
      }

      await client.query(`
        UPDATE stock 
        SET producto_variacion_id = $1 
        WHERE id = $2
      `, [varId, row.id]);
    }

    // 3. Clean any stock without varId
    const cleanStockNulls = await client.query("DELETE FROM stock WHERE producto_variacion_id IS NULL");
    if (cleanStockNulls.rowCount > 0) {
      console.log(`Pre-migration: Deleted ${cleanStockNulls.rowCount} stock records due to missing variation.`);
    }

    // 4. Set stock.producto_variacion_id to NOT NULL
    console.log('Pre-migration: Altering stock.producto_variacion_id to SET NOT NULL...');
    await client.query('ALTER TABLE "stock" ALTER COLUMN "producto_variacion_id" SET NOT NULL');

    // Drop redundant proveedor_id and columns from lotes_ingreso / ajustes_inventario
    const dropCols = [
      ['lotes_ingreso', 'proveedor_id'],
      ['lotes_ingreso', 'producto_id'],
      ['lotes_ingreso', 'sucursal_id'],
      ['ajustes_inventario', 'producto_id'],
      ['ajustes_inventario', 'sucursal_id'],
    ];
    for (const [table, col] of dropCols) {
      const checkDrop = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = $1 AND column_name = $2
      `, [table, col]);
      if (checkDrop.rowCount > 0) {
        // Drop FK constraints first if they exist
        const fks = await client.query(`
          SELECT constraint_name FROM information_schema.table_constraints
          WHERE table_name = $1 AND constraint_type = 'FOREIGN KEY'
          AND constraint_name LIKE '%' || $2 || '%'
        `, [table, col]);
        for (const fk of fks.rows) {
          console.log(`Pre-migration: Dropping FK ${fk.constraint_name} on ${table}...`);
          await client.query(`ALTER TABLE "${table}" DROP CONSTRAINT "${fk.constraint_name}"`);
        }
        console.log(`Pre-migration: Dropping ${table}.${col} (redundant)...`);
        await client.query(`ALTER TABLE "${table}" DROP COLUMN "${col}"`);
      }
    }

    console.log('Pre-startup migrations completed successfully.');
  } catch (error) {
    console.error('CRITICAL: Error running pre-startup migrations:', error);
    throw error; // Propagate error so application startup fails and does not attempt DB synchronization in a corrupted state
  } finally {
    await client.end();
  }
}
