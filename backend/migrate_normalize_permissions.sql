begin;

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

with permission_defs("key", module, action) as (
  values
    ('sucursales_ver', 'sucursales', 'ver'),
    ('sucursales_crear', 'sucursales', 'crear'),
    ('sucursales_editar', 'sucursales', 'editar'),
    ('sucursales_eliminar', 'sucursales', 'eliminar'),
    ('catalogo_ver', 'catalogo', 'ver'),
    ('catalogo_crear', 'catalogo', 'crear'),
    ('catalogo_editar', 'catalogo', 'editar'),
    ('catalogo_eliminar', 'catalogo', 'eliminar'),
    ('proveedores_ver', 'proveedores', 'ver'),
    ('proveedores_crear', 'proveedores', 'crear'),
    ('proveedores_editar', 'proveedores', 'editar'),
    ('proveedores_eliminar', 'proveedores', 'eliminar'),
    ('sourcing_ver', 'sourcing', 'ver'),
    ('sourcing_crear', 'sourcing', 'crear'),
    ('sourcing_editar', 'sourcing', 'editar'),
    ('sourcing_eliminar', 'sourcing', 'eliminar'),
    ('inventario_ver', 'inventario', 'ver'),
    ('inventario_crear', 'inventario', 'crear'),
    ('inventario_editar', 'inventario', 'editar'),
    ('inventario_eliminar', 'inventario', 'eliminar'),
    ('usuarios_ver', 'usuarios', 'ver'),
    ('usuarios_crear', 'usuarios', 'crear'),
    ('usuarios_editar', 'usuarios', 'editar'),
    ('usuarios_eliminar', 'usuarios', 'eliminar'),
    ('ventas_ver', 'ventas', 'ver'),
    ('ventas_crear', 'ventas', 'crear'),
    ('ventas_editar', 'ventas', 'editar'),
    ('ventas_eliminar', 'ventas', 'eliminar')
)
insert into public.permissions ("key", module, action)
select "key", module, action
from permission_defs
on conflict ("key") do update
  set module = excluded.module,
      action = excluded.action;

do $$
begin
  if to_regclass('public.role_permissions') is not null then
    execute $migrate$
      insert into public.roles (tenant_id, name, "isSystem")
      select distinct
        rp.tenant_id::uuid,
        rp.role,
        rp.role in ('SUPERVISOR', 'VENDEDOR')
      from public.role_permissions rp
      where rp.tenant_id is not null
        and rp.tenant_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and rp.role is not null
      on conflict (tenant_id, name) do update
        set "isSystem" = public.roles."isSystem" or excluded."isSystem",
            "updatedAt" = now()
    $migrate$;

    execute $migrate$
      insert into public.role_permission_assignments
        (role_id, permission_id, enabled)
      select
        r.id,
        p.id,
        coalesce(v.enabled, false)
      from public.role_permissions rp
      join public.roles r
        on r.tenant_id = rp.tenant_id::uuid
       and r.name = rp.role
      cross join lateral (
        values
          ('sucursales_ver', rp.sucursales_ver),
          ('sucursales_crear', rp.sucursales_crear),
          ('sucursales_editar', rp.sucursales_editar),
          ('sucursales_eliminar', rp.sucursales_eliminar),
          ('catalogo_ver', rp.catalogo_ver),
          ('catalogo_crear', rp.catalogo_crear),
          ('catalogo_editar', rp.catalogo_editar),
          ('catalogo_eliminar', rp.catalogo_eliminar),
          ('proveedores_ver', rp.proveedores_ver),
          ('proveedores_crear', rp.proveedores_crear),
          ('proveedores_editar', rp.proveedores_editar),
          ('proveedores_eliminar', rp.proveedores_eliminar),
          ('sourcing_ver', rp.sourcing_ver),
          ('sourcing_crear', rp.sourcing_crear),
          ('sourcing_editar', rp.sourcing_editar),
          ('sourcing_eliminar', rp.sourcing_eliminar),
          ('inventario_ver', rp.inventario_ver),
          ('inventario_crear', rp.inventario_crear),
          ('inventario_editar', rp.inventario_editar),
          ('inventario_eliminar', rp.inventario_eliminar),
          ('usuarios_ver', rp.usuarios_ver),
          ('usuarios_crear', rp.usuarios_crear),
          ('usuarios_editar', rp.usuarios_editar),
          ('usuarios_eliminar', rp.usuarios_eliminar),
          ('ventas_ver', rp.ventas_ver),
          ('ventas_crear', rp.ventas_crear),
          ('ventas_editar', rp.ventas_editar),
          ('ventas_eliminar', rp.ventas_eliminar)
      ) as v(permission_key, enabled)
      join public.permissions p on p."key" = v.permission_key
      where rp.tenant_id is not null
        and rp.tenant_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        and rp.role is not null
      on conflict (role_id, permission_id) do update
        set enabled = excluded.enabled
    $migrate$;

    execute 'drop table public.role_permissions';
  end if;
end $$;

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

commit;
