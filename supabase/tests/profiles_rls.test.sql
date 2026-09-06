begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table('public', 'profiles', 'profiles table exists');
select col_is_pk('public', 'profiles', 'id', 'id is the primary key');
select col_not_null('public', 'profiles', 'display_name', 'display_name is required');
select has_check('public', 'profiles', 'display_name has database constraints');
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.profiles'::regclass
      and contype = 'f'
      and confrelid = 'auth.users'::regclass
      and confdeltype = 'c'
  ),
  'id references the auth.users primary key with ON DELETE CASCADE'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'RLS is enabled'
);

select ok(not has_any_column_privilege('anon', 'public.profiles', 'SELECT'), 'anon has no SELECT grant');
select ok(not has_any_column_privilege('anon', 'public.profiles', 'INSERT'), 'anon has no INSERT grant');
select ok(not has_any_column_privilege('anon', 'public.profiles', 'UPDATE'), 'anon has no UPDATE grant');
select ok(not has_table_privilege('anon', 'public.profiles', 'DELETE'), 'anon has no DELETE grant');
select ok(not has_any_column_privilege('public', 'public.profiles', 'SELECT'), 'PUBLIC has no SELECT grant');
select ok(not has_any_column_privilege('public', 'public.profiles', 'INSERT'), 'PUBLIC has no INSERT grant');
select ok(not has_any_column_privilege('public', 'public.profiles', 'UPDATE'), 'PUBLIC has no UPDATE grant');
select ok(not has_table_privilege('public', 'public.profiles', 'DELETE'), 'PUBLIC has no DELETE grant');
select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'SELECT'), 'authenticated can select display_name');
select ok(has_column_privilege('authenticated', 'public.profiles', 'id', 'INSERT'), 'authenticated can insert id');
select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'INSERT'), 'authenticated can insert display_name');
select ok(has_column_privilege('authenticated', 'public.profiles', 'display_name', 'UPDATE'), 'authenticated can update display_name');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'id', 'UPDATE'), 'authenticated cannot update id');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'created_at', 'UPDATE'), 'authenticated cannot update created_at');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'updated_at', 'UPDATE'), 'authenticated cannot update updated_at');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'DELETE'), 'authenticated cannot delete');
select ok(has_table_privilege('service_role', 'public.profiles', 'SELECT'), 'service_role can select profiles');
select ok(has_table_privilege('service_role', 'public.profiles', 'DELETE'), 'service_role can delete profiles');
select ok(not has_table_privilege('service_role', 'public.profiles', 'INSERT'), 'service_role cannot insert profiles');
select ok(not has_table_privilege('service_role', 'public.profiles', 'UPDATE'), 'service_role cannot update profiles');
select ok(not has_function_privilege('public', 'public.handle_new_auth_user_profile()', 'EXECUTE'), 'PUBLIC cannot execute signup trigger function');
select ok(not has_function_privilege('anon', 'public.handle_new_auth_user_profile()', 'EXECUTE'), 'anon cannot execute signup trigger function');
select ok(not has_function_privilege('authenticated', 'public.handle_new_auth_user_profile()', 'EXECUTE'), 'authenticated cannot execute signup trigger function');
select ok(not has_function_privilege('service_role', 'public.handle_new_auth_user_profile()', 'EXECUTE'), 'service_role cannot execute signup trigger function');
select ok(not has_function_privilege('public', 'public.strip_profile_bootstrap_metadata()', 'EXECUTE'), 'PUBLIC cannot execute metadata cleanup trigger function');
select ok(not has_function_privilege('anon', 'public.strip_profile_bootstrap_metadata()', 'EXECUTE'), 'anon cannot execute metadata cleanup trigger function');
select ok(not has_function_privilege('authenticated', 'public.strip_profile_bootstrap_metadata()', 'EXECUTE'), 'authenticated cannot execute metadata cleanup trigger function');
select ok(not has_function_privilege('service_role', 'public.strip_profile_bootstrap_metadata()', 'EXECUTE'), 'service_role cannot execute metadata cleanup trigger function');
select ok(not has_function_privilege('public', 'public.set_profile_timestamps()', 'EXECUTE'), 'PUBLIC cannot execute timestamp trigger function');
select ok(not has_function_privilege('anon', 'public.set_profile_timestamps()', 'EXECUTE'), 'anon cannot execute timestamp trigger function');
select ok(not has_function_privilege('authenticated', 'public.set_profile_timestamps()', 'EXECUTE'), 'authenticated cannot execute timestamp trigger function');
select ok(not has_function_privilege('service_role', 'public.set_profile_timestamps()', 'EXECUTE'), 'service_role cannot execute timestamp trigger function');

insert into auth.users (id, email, raw_user_meta_data) values
  (
    '11111111-1111-4111-8111-111111111111',
    'profile-a@example.invalid',
    '{"display_name":"合成利用者A"}'::jsonb
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'profile-b@example.invalid',
    '{"display_name":"Synthetic 😀 B"}'::jsonb
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'profile-c@example.invalid',
    '{"display_name":"合成利用者C"}'::jsonb
  );

select results_eq(
  $$select count(*) from public.profiles$$,
  array[3::bigint],
  'auth insert trigger creates one required profile per user'
);
select results_eq(
  $$select raw_user_meta_data ? 'display_name' from auth.users order by id$$,
  array[false, false, false],
  'bootstrap display names are removed from Auth metadata'
);
select throws_like(
  $$insert into auth.users (id, email, raw_user_meta_data) values (
      '44444444-4444-4444-8444-444444444444',
      'profile-invalid@example.invalid',
      '{"display_name":"   "}'::jsonb
    )$$,
  '%violates check constraint%',
  'invalid profile data aborts Auth user creation'
);
select results_eq(
  $$select count(*) from auth.users where id = '44444444-4444-4444-8444-444444444444'$$,
  array[0::bigint],
  'failed trigger leaves no orphan Auth user'
);

select lives_ok(
  $$update public.profiles set display_name = '界' where id = '11111111-1111-4111-8111-111111111111'$$,
  'database accepts one Unicode character'
);
select lives_ok(
  $$update public.profiles set display_name = repeat('界', 50) where id = '11111111-1111-4111-8111-111111111111'$$,
  'database accepts fifty Unicode characters'
);
select throws_like(
  $$update public.profiles set display_name = '' where id = '11111111-1111-4111-8111-111111111111'$$,
  '%violates check constraint%',
  'database rejects an empty display name'
);
select throws_like(
  $$update public.profiles set display_name = ' surrounded ' where id = '11111111-1111-4111-8111-111111111111'$$,
  '%violates check constraint%',
  'database rejects an unnormalized display name'
);
select throws_like(
  $$update public.profiles set display_name = chr(160) || 'NBSP' || chr(160)
    where id = '11111111-1111-4111-8111-111111111111'$$,
  '%violates check constraint%',
  'database rejects unnormalized NBSP'
);
select throws_like(
  $$update public.profiles set display_name = chr(12288) || 'IDEOGRAPHIC' || chr(12288)
    where id = '11111111-1111-4111-8111-111111111111'$$,
  '%violates check constraint%',
  'database rejects unnormalized IDEOGRAPHIC SPACE'
);
select throws_like(
  $$update public.profiles set display_name = chr(65279) || 'BOM' || chr(65279)
    where id = '11111111-1111-4111-8111-111111111111'$$,
  '%violates check constraint%',
  'database rejects unnormalized BOM'
);
select lives_ok(
  $$update public.profiles set display_name = '内部' || chr(160) || '空白'
    where id = '11111111-1111-4111-8111-111111111111'$$,
  'database accepts internal Unicode whitespace'
);
select throws_like(
  $$update public.profiles set display_name = repeat('界', 51) where id = '11111111-1111-4111-8111-111111111111'$$,
  '%violates check constraint%',
  'database rejects fifty-one characters'
);
select throws_like(
  $$update public.profiles set display_name = E'合成\n利用者' where id = '11111111-1111-4111-8111-111111111111'$$,
  '%violates check constraint%',
  'database rejects newlines'
);
select throws_like(
  $$update public.profiles set display_name = E'合成\x7f利用者' where id = '11111111-1111-4111-8111-111111111111'$$,
  '%violates check constraint%',
  'database rejects control characters'
);
select throws_like(
  $$update public.profiles set display_name = '合成' || chr(133) || '利用者'
    where id = '11111111-1111-4111-8111-111111111111'$$,
  '%violates check constraint%',
  'database rejects C1 control characters'
);

delete from public.profiles where id = '33333333-3333-4333-8333-333333333333';
select throws_like(
  $$insert into public.profiles (id, display_name) values (
      '33333333-3333-4333-8333-333333333333', chr(160) || '未正規化insert' || chr(160)
    )$$,
  '%violates check constraint%',
  'database rejects direct insert with unnormalized Unicode whitespace'
);
select results_eq(
  $$select count(*) from public.profiles where id = '33333333-3333-4333-8333-333333333333'$$,
  array[0::bigint],
  'failed unnormalized insert leaves no profile'
);

create temporary table profile_before_update as
select created_at, updated_at
from public.profiles
where id = '11111111-1111-4111-8111-111111111111';

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select results_eq(
  $$select id from public.profiles$$,
  array['11111111-1111-4111-8111-111111111111'::uuid],
  'user A can read only their profile'
);
select lives_ok(
  $$update public.profiles set display_name = '更新済み利用者A'
    where id = '11111111-1111-4111-8111-111111111111'$$,
  'user A can update their display name'
);
select results_eq(
  $$select display_name from public.profiles$$,
  array['更新済み利用者A'::text],
  'user A reads the updated database value'
);
select results_eq(
  $$update public.profiles set display_name = '不正な他人更新'
    where id = '22222222-2222-4222-8222-222222222222' returning id$$,
  $$select null::uuid where false$$,
  'RLS prevents user A from updating user B'
);
select throws_ok(
  $$update public.profiles set created_at = statement_timestamp()
    where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  'permission denied for table profiles',
  'column grants prevent created_at updates'
);
select throws_ok(
  $$update public.profiles set updated_at = statement_timestamp()
    where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  'permission denied for table profiles',
  'column grants prevent updated_at updates'
);
select throws_ok(
  $$update public.profiles set id = '22222222-2222-4222-8222-222222222222'
    where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  'permission denied for table profiles',
  'column grants prevent id updates'
);
select throws_ok(
  $$delete from public.profiles where id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  'permission denied for table profiles',
  'authenticated users cannot delete profiles'
);

reset role;
select is(
  (select created_at from public.profiles where id = '11111111-1111-4111-8111-111111111111'),
  (select created_at from profile_before_update),
  'created_at is preserved on update'
);
select ok(
  (select updated_at from public.profiles where id = '11111111-1111-4111-8111-111111111111')
    > (select updated_at from profile_before_update),
  'updated_at advances on update'
);

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"33333333-3333-4333-8333-333333333333","role":"authenticated"}';
select lives_ok(
  $$insert into public.profiles (id, display_name) values (
      '33333333-3333-4333-8333-333333333333', '本人再作成'
    )$$,
  'insert grant and RLS allow a user to insert only their profile'
);
select throws_ok(
  $$insert into public.profiles (id, display_name) values (
      '22222222-2222-4222-8222-222222222222', '他人再作成'
    )$$,
  '42501',
  'new row violates row-level security policy for table "profiles"',
  'RLS prevents inserting another user profile'
);

reset role;
set local role anon;
select throws_ok(
  $$select display_name from public.profiles$$,
  '42501',
  'permission denied for table profiles',
  'anon requests fail at the GRANT layer'
);

reset role;
delete from auth.users where id = '22222222-2222-4222-8222-222222222222';
select results_eq(
  $$select count(*) from public.profiles where id = '22222222-2222-4222-8222-222222222222'$$,
  array[0::bigint],
  'deleting an Auth user cascades to the profile'
);

select * from finish();

rollback;
