begin;

create extension if not exists pgtap with schema extensions;
select plan(1);

select hasnt_table(
  'public',
  'kv_store_f3d88633',
  'legacy KV table is absent after repository migrations'
);

select * from finish();
rollback;
