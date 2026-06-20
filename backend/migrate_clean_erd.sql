begin;

alter table public.ajustes_inventario add column if not exists stock_id uuid;
alter table public.movimientos_inventario add column if not exists stock_id uuid;
alter table public.transferencias_stock add column if not exists from_stock_id uuid;
alter table public.transferencias_stock add column if not exists to_stock_id uuid;

create index if not exists idx_ajustes_inventario_stock_id on public.ajustes_inventario(stock_id);
create index if not exists idx_movimientos_inventario_stock_id on public.movimientos_inventario(stock_id);
create index if not exists idx_transferencias_stock_from_stock_id on public.transferencias_stock(from_stock_id);
create index if not exists idx_transferencias_stock_to_stock_id on public.transferencias_stock(to_stock_id);

do $$
declare
  fk record;
begin
  for fk in
    select
      t.relname as table_name,
      c.conname as constraint_name
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    join unnest(c.conkey) as ck(attnum) on true
    join pg_attribute a on a.attrelid = t.oid and a.attnum = ck.attnum
    where c.contype = 'f'
      and n.nspname = 'public'
      and (
        (t.relname = 'ajustes_inventario' and a.attname in ('tenant_id', 'sucursal_id', 'producto_id', 'usuario_id'))
        or (t.relname = 'movimientos_inventario' and a.attname in ('tenant_id', 'sucursal_id', 'producto_id', 'usuario_id'))
        or (t.relname = 'transferencias_stock' and a.attname in ('tenant_id', 'from_sucursal_id', 'to_sucursal_id', 'producto_id', 'usuario_id'))
        or (t.relname = 'users' and a.attname = 'tenant_id')
        or (t.relname = 'clientes' and a.attname = 'tenant_id')
      )
  loop
    execute format('alter table public.%I drop constraint if exists %I', fk.table_name, fk.constraint_name);
  end loop;
end $$;

do $$
begin
  if to_regclass('public.role_permissions') is not null then
    if exists (
      select 1
      from public.role_permissions
      where tenant_id is not null
        and tenant_id::text !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ) then
      raise exception 'role_permissions tiene tenant_id no convertibles a uuid';
    end if;
  end if;
end $$;

do $$
begin
  if to_regclass('public.role_permissions') is not null then
    alter table public.role_permissions
      alter column tenant_id type uuid using tenant_id::uuid;
  end if;
end $$;

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

alter table public.ajustes_inventario drop constraint if exists fk_ajustes_inventario_stock;
alter table public.movimientos_inventario drop constraint if exists fk_movimientos_inventario_stock;
alter table public.transferencias_stock drop constraint if exists fk_transferencias_stock_origen;
alter table public.transferencias_stock drop constraint if exists fk_transferencias_stock_destino;

do $$
begin
  if to_regclass('public.role_permissions') is not null then
    alter table public.role_permissions drop constraint if exists fk_role_permissions_tenant;
  end if;
end $$;

alter table public.ajustes_inventario
  add constraint fk_ajustes_inventario_stock
  foreign key (stock_id)
  references public.stock(id)
  on delete set null;

alter table public.movimientos_inventario
  add constraint fk_movimientos_inventario_stock
  foreign key (stock_id)
  references public.stock(id)
  on delete set null;

alter table public.transferencias_stock
  add constraint fk_transferencias_stock_origen
  foreign key (from_stock_id)
  references public.stock(id)
  on delete set null;

alter table public.transferencias_stock
  add constraint fk_transferencias_stock_destino
  foreign key (to_stock_id)
  references public.stock(id)
  on delete set null;

do $$
begin
  if to_regclass('public.role_permissions') is not null then
    alter table public.role_permissions
      add constraint fk_role_permissions_tenant
      foreign key (tenant_id)
      references public.tenants(id)
      on delete cascade;
  end if;
end $$;

commit;
