const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

const client = new Client(
  connectionString
    ? {
        connectionString,
        ssl:
          process.env.DB_SSL === 'true' || process.env.RENDER
            ? { rejectUnauthorized: false }
            : false,
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '1234',
        database: process.env.DB_DATABASE || 'mall_db',
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
);

const ident = (value) => `"${String(value).replace(/"/g, '""')}"`;

const tableExists = async (tableName) => {
  const { rows } = await client.query(`select to_regclass($1) is not null as exists`, [
    `public.${tableName}`,
  ]);
  return rows[0].exists;
};

const dropFkForColumn = async (tableName, columnName) => {
  const { rows } = await client.query(
    `
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join unnest(c.conkey) as ck(attnum) on true
    join pg_attribute a on a.attrelid = t.oid and a.attnum = ck.attnum
    where c.contype = 'f'
      and n.nspname = 'public'
      and t.relname = $1
      and a.attname = $2
    `,
    [tableName, columnName],
  );

  for (const row of rows) {
    await client.query(
      `alter table public.${ident(tableName)} drop constraint if exists ${ident(row.conname)}`,
    );
  }
};

const addFkIfMissing = async (tableName, constraintName, columnName) => {
  const { rowCount } = await client.query(
    `select 1 from pg_constraint where conname = $1 and conrelid = $2::regclass`,
    [constraintName, `public.${tableName}`],
  );

  if (rowCount === 0) {
    await client.query(
      `alter table public.${ident(tableName)} add constraint ${ident(constraintName)} foreign key (${ident(columnName)}) references public.stock(id) on delete set null`,
    );
  }
};

async function main() {
  await client.connect();
  await client.query('begin');

  try {
    await client.query(`
      alter table public.ajustes_inventario add column if not exists stock_id uuid;
      alter table public.movimientos_inventario add column if not exists stock_id uuid;
      alter table public.transferencias_stock add column if not exists from_stock_id uuid;
      alter table public.transferencias_stock add column if not exists to_stock_id uuid;

      create index if not exists idx_ajustes_inventario_stock_id on public.ajustes_inventario(stock_id);
      create index if not exists idx_movimientos_inventario_stock_id on public.movimientos_inventario(stock_id);
      create index if not exists idx_transferencias_stock_from_stock_id on public.transferencias_stock(from_stock_id);
      create index if not exists idx_transferencias_stock_to_stock_id on public.transferencias_stock(to_stock_id);
    `);

    const noisyForeignKeys = [
      ['ajustes_inventario', 'tenant_id'],
      ['ajustes_inventario', 'sucursal_id'],
      ['ajustes_inventario', 'producto_id'],
      ['ajustes_inventario', 'usuario_id'],
      ['movimientos_inventario', 'tenant_id'],
      ['movimientos_inventario', 'sucursal_id'],
      ['movimientos_inventario', 'producto_id'],
      ['movimientos_inventario', 'usuario_id'],
      ['transferencias_stock', 'tenant_id'],
      ['transferencias_stock', 'from_sucursal_id'],
      ['transferencias_stock', 'to_sucursal_id'],
      ['transferencias_stock', 'producto_id'],
      ['transferencias_stock', 'usuario_id'],
      ['users', 'tenant_id'],
      ['clientes', 'tenant_id'],
    ];

    for (const [tableName, columnName] of noisyForeignKeys) {
      await dropFkForColumn(tableName, columnName);
    }

    const legacyRolePermissionsExists = await tableExists('role_permissions');

    if (legacyRolePermissionsExists) {
      await dropFkForColumn('role_permissions', 'tenant_id');

      const invalidRoleTenantIds = await client.query(`
        select tenant_id
        from public.role_permissions
        where tenant_id is not null
          and tenant_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      `);

      if (invalidRoleTenantIds.rowCount > 0) {
        throw new Error(
          `role_permissions has invalid tenant_id values: ${invalidRoleTenantIds.rows
            .map(row => row.tenant_id)
            .join(', ')}`,
        );
      }

      await client.query(`
        alter table public.role_permissions
          alter column tenant_id type uuid using tenant_id::uuid;
      `);
    }

    await client.query(`
      update public.ajustes_inventario a
      set stock_id = s.id
      from public.stock s
      where a.stock_id is null
        and s.tenant_id is not distinct from a.tenant_id
        and s.sucursal_id = a.sucursal_id
        and s.producto_id = a.producto_id;

      update public.movimientos_inventario m
      set stock_id = s.id
      from public.stock s
      where m.stock_id is null
        and s.tenant_id is not distinct from m.tenant_id
        and s.sucursal_id = m.sucursal_id
        and s.producto_id = m.producto_id;

      update public.transferencias_stock t
      set from_stock_id = s.id
      from public.stock s
      where t.from_stock_id is null
        and s.tenant_id is not distinct from t.tenant_id
        and s.sucursal_id = t.from_sucursal_id
        and s.producto_id = t.producto_id;

      update public.transferencias_stock t
      set to_stock_id = s.id
      from public.stock s
      where t.to_stock_id is null
        and s.tenant_id is not distinct from t.tenant_id
        and s.sucursal_id = t.to_sucursal_id
        and s.producto_id = t.producto_id;
    `);

    await addFkIfMissing('ajustes_inventario', 'fk_ajustes_inventario_stock', 'stock_id');
    await addFkIfMissing('movimientos_inventario', 'fk_movimientos_inventario_stock', 'stock_id');
    await addFkIfMissing('transferencias_stock', 'fk_transferencias_stock_origen', 'from_stock_id');
    await addFkIfMissing('transferencias_stock', 'fk_transferencias_stock_destino', 'to_stock_id');
    if (legacyRolePermissionsExists) {
      await client.query(`
        do $$
        begin
          if not exists (
            select 1
            from pg_constraint
            where conname = 'fk_role_permissions_tenant'
              and conrelid = 'public.role_permissions'::regclass
          ) then
            alter table public.role_permissions
              add constraint fk_role_permissions_tenant
              foreign key (tenant_id)
              references public.tenants(id)
              on delete cascade;
          end if;
        end $$;
      `);
    }

    await client.query('commit');
    console.log('ERD cleanup migration completed.');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
