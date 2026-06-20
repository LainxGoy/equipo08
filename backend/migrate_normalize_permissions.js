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
        ssl:
          process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      },
);

const permissionKeys = [
  'sucursales_ver',
  'sucursales_crear',
  'sucursales_editar',
  'sucursales_eliminar',
  'catalogo_ver',
  'catalogo_crear',
  'catalogo_editar',
  'catalogo_eliminar',
  'proveedores_ver',
  'proveedores_crear',
  'proveedores_editar',
  'proveedores_eliminar',
  'sourcing_ver',
  'sourcing_crear',
  'sourcing_editar',
  'sourcing_eliminar',
  'inventario_ver',
  'inventario_crear',
  'inventario_editar',
  'inventario_eliminar',
  'usuarios_ver',
  'usuarios_crear',
  'usuarios_editar',
  'usuarios_eliminar',
  'ventas_ver',
  'ventas_crear',
  'ventas_editar',
  'ventas_eliminar',
];

const tableExists = async (tableName) => {
  const { rows } = await client.query(
    `select to_regclass($1) is not null as exists`,
    [`public.${tableName}`],
  );
  return rows[0].exists;
};

const hasColumn = async (tableName, columnName) => {
  const { rowCount } = await client.query(
    `
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = $1
      and column_name = $2
    `,
    [tableName, columnName],
  );
  return rowCount > 0;
};

async function createNormalizedTables() {
  await client.query(`
    create extension if not exists "pgcrypto";

    create table if not exists public.permissions (
      id uuid primary key default gen_random_uuid(),
      "key" character varying not null,
      module character varying not null,
      action character varying not null,
      description character varying,
      "createdAt" timestamp not null default now(),
      constraint uq_permissions_key unique ("key")
    );

    create table if not exists public.roles (
      id uuid primary key default gen_random_uuid(),
      tenant_id uuid not null,
      name character varying not null,
      "isSystem" boolean not null default false,
      "createdAt" timestamp not null default now(),
      "updatedAt" timestamp not null default now(),
      constraint uq_roles_tenant_name unique (tenant_id, name),
      constraint fk_roles_tenant
        foreign key (tenant_id)
        references public.tenants(id)
        on delete cascade
    );

    create table if not exists public.role_permission_assignments (
      id uuid primary key default gen_random_uuid(),
      role_id uuid not null,
      permission_id uuid not null,
      enabled boolean not null default false,
      constraint uq_role_permission_assignment unique (role_id, permission_id),
      constraint fk_role_permission_assignments_role
        foreign key (role_id)
        references public.roles(id)
        on delete cascade,
      constraint fk_role_permission_assignments_permission
        foreign key (permission_id)
        references public.permissions(id)
        on delete cascade
    );
  `);
}

async function upsertPermissionCatalog() {
  const permissionIds = new Map();

  for (const key of permissionKeys) {
    const [module, action] = key.split('_');
    const { rows } = await client.query(
      `
      insert into public.permissions ("key", module, action)
      values ($1, $2, $3)
      on conflict ("key") do update
        set module = excluded.module,
            action = excluded.action
      returning id
      `,
      [key, module, action],
    );
    permissionIds.set(key, rows[0].id);
  }

  return permissionIds;
}

async function migrateLegacyRolePermissions(permissionIds) {
  const legacyTableExists = await tableExists('role_permissions');
  const legacyHasRole = await hasColumn('role_permissions', 'role');

  if (!legacyTableExists || !legacyHasRole) {
    return;
  }

  const { rows } = await client.query(`select * from public.role_permissions`);

  for (const row of rows) {
    if (!row.tenant_id || !row.role) continue;

    const { rows: roleRows } = await client.query(
      `
      insert into public.roles (tenant_id, name, "isSystem")
      values ($1, $2, $3)
      on conflict (tenant_id, name) do update
        set "isSystem" = public.roles."isSystem" or excluded."isSystem",
            "updatedAt" = now()
      returning id
      `,
      [row.tenant_id, row.role, ['SUPERVISOR', 'VENDEDOR'].includes(row.role)],
    );
    const roleId = roleRows[0].id;

    for (const key of permissionKeys) {
      await client.query(
        `
        insert into public.role_permission_assignments
          (role_id, permission_id, enabled)
        values ($1, $2, $3)
        on conflict (role_id, permission_id) do update
          set enabled = excluded.enabled
        `,
        [roleId, permissionIds.get(key), row[key] === true],
      );
    }
  }

  await client.query(`drop table public.role_permissions`);
}

async function linkUsersToRoles() {
  await client.query(`
    alter table public.users add column if not exists role_id uuid;
    create index if not exists idx_users_role_id on public.users(role_id);

    insert into public.roles (tenant_id, name, "isSystem")
    select distinct
      u.tenant_id::uuid,
      u.role::text,
      u.role::text in ('OWNER', 'SUPERVISOR', 'VENDEDOR')
    from public.users u
    where u.tenant_id is not null
      and u.tenant_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and u.role is not null
    on conflict (tenant_id, name) do update
      set "isSystem" = public.roles."isSystem" or excluded."isSystem",
          "updatedAt" = now();

    update public.users u
    set role_id = r.id
    from public.roles r
    where u.role_id is null
      and u.tenant_id is not null
      and u.tenant_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and r.tenant_id = u.tenant_id::uuid
      and r.name = u.role::text;

    do $$
    begin
      if not exists (
        select 1
        from pg_constraint
        where conname = 'fk_users_role'
          and conrelid = 'public.users'::regclass
      ) then
        alter table public.users
          add constraint fk_users_role
          foreign key (role_id)
          references public.roles(id)
          on delete set null;
      end if;
    end $$;
  `);
}

async function main() {
  await client.connect();
  await client.query('begin');

  try {
    await createNormalizedTables();
    const permissionIds = await upsertPermissionCatalog();
    await migrateLegacyRolePermissions(permissionIds);
    await linkUsersToRoles();

    await client.query('commit');
    console.log('Permissions normalization migration completed.');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
