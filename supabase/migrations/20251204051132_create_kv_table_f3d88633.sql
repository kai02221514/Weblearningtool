-- Reconstruct the migration version already recorded on the designated remote.
-- The legacy object is removed by the later KAI-33 migration in this repository.
create table public.kv_store_f3d88633 (
  key text primary key,
  value jsonb not null
);

alter table public.kv_store_f3d88633 enable row level security;

revoke all on table public.kv_store_f3d88633
  from public, anon, authenticated, service_role;
grant select, insert, update, delete, truncate, references, trigger
  on table public.kv_store_f3d88633
  to anon, authenticated, service_role;

create index kv_store_f3d88633_key_idx
  on public.kv_store_f3d88633 using btree (key text_pattern_ops);
create index kv_store_f3d88633_key_idx1
  on public.kv_store_f3d88633 using btree (key text_pattern_ops);
create index kv_store_f3d88633_key_idx2
  on public.kv_store_f3d88633 using btree (key text_pattern_ops);
