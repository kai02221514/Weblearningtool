do $$
declare
  legacy_kv_has_rows boolean;
begin
  if to_regclass('public.kv_store_f3d88633') is not null then
    execute 'select exists (select 1 from public.kv_store_f3d88633)'
      into legacy_kv_has_rows;

    if legacy_kv_has_rows then
      raise exception using
        errcode = 'P0001',
        message = 'KAI-33 stop condition: public.kv_store_f3d88633 is not empty';
    end if;
  end if;
end
$$;

drop table if exists public.kv_store_f3d88633;
