begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

select has_table('public', 'user_diagnoses', 'diagnosis table exists');
select col_is_pk('public', 'user_diagnoses', 'user_id', 'user_id is the primary key');
select has_check('public', 'user_diagnoses', 'programming experience is constrained');
select has_check('public', 'user_diagnoses', 'rule confidence is constrained');
select has_check('public', 'user_diagnoses', 'knowledge concept is constrained');
select has_check('public', 'user_diagnoses', 'diagnosis version is constrained');
select is(
  (select relrowsecurity from pg_class where oid = 'public.user_diagnoses'::regclass),
  true,
  'RLS is enabled'
);

select ok(not has_table_privilege('anon', 'public.user_diagnoses', 'SELECT'), 'anon cannot select');
select ok(not has_table_privilege('anon', 'public.user_diagnoses', 'INSERT'), 'anon cannot insert');
select ok(not has_table_privilege('anon', 'public.user_diagnoses', 'UPDATE'), 'anon cannot update');
select ok(has_table_privilege('authenticated', 'public.user_diagnoses', 'SELECT'), 'authenticated can select');
select ok(has_table_privilege('authenticated', 'public.user_diagnoses', 'INSERT'), 'authenticated can insert');
select ok(has_table_privilege('authenticated', 'public.user_diagnoses', 'UPDATE'), 'authenticated can update');
select ok(not has_table_privilege('authenticated', 'public.user_diagnoses', 'DELETE'), 'authenticated cannot delete');

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'synthetic-a@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'synthetic-b@example.invalid');

set local role authenticated;
set local "request.jwt.claims" = '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}';

select lives_ok(
  $$insert into public.user_diagnoses (
      user_id, programming_experience, rule_confidence, knowledge_concept, diagnosis_version
    ) values (
      '11111111-1111-4111-8111-111111111111', 'yes', 'partial', 'somewhat', 'diagnosis-k/v1'
    )$$,
  'user A can insert their diagnosis'
);
select results_eq(
  $$select count(*) from public.user_diagnoses$$,
  array[1::bigint],
  'user A can select only their row'
);
select throws_ok(
  $$insert into public.user_diagnoses (
      user_id, programming_experience, rule_confidence, knowledge_concept, diagnosis_version
    ) values (
      '22222222-2222-4222-8222-222222222222', 'no', 'none', 'unknown', 'diagnosis-k/v1'
    )$$,
  '42501',
  'new row violates row-level security policy for table "user_diagnoses"',
  'user A cannot insert for user B'
);
select results_eq(
  $$update public.user_diagnoses set rule_confidence = 'confident'
    where user_id = '22222222-2222-4222-8222-222222222222' returning user_id$$,
  $$select null::uuid where false$$,
  'user A cannot update user B'
);
select throws_ok(
  $$delete from public.user_diagnoses where user_id = '11111111-1111-4111-8111-111111111111'$$,
  '42501',
  'permission denied for table user_diagnoses',
  'authenticated cannot delete'
);

select lives_ok(
  $$insert into public.user_diagnoses (
      user_id, programming_experience, rule_confidence, knowledge_concept, diagnosis_version
    ) values (
      '11111111-1111-4111-8111-111111111111', 'no', 'low', 'visual_only', 'diagnosis-k/v1'
    ) on conflict (user_id) do update set
      programming_experience = excluded.programming_experience,
      rule_confidence = excluded.rule_confidence,
      knowledge_concept = excluded.knowledge_concept,
      diagnosis_version = excluded.diagnosis_version$$,
  'user A can upsert their diagnosis'
);
select results_eq(
  $$select count(*) from public.user_diagnoses$$,
  array[1::bigint],
  'upsert keeps one current row'
);
select results_eq(
  $$select programming_experience || ',' || rule_confidence || ',' || knowledge_concept || ',' || diagnosis_version
    from public.user_diagnoses$$,
  array['no,low,visual_only,diagnosis-k/v1'::text],
  'upsert replaces all answers and version'
);
select results_eq(
  $$select count(*) from public.user_diagnoses where completed_at = updated_at$$,
  array[1::bigint],
  'database assigns both timestamps together'
);

reset role;
insert into public.user_diagnoses (
  user_id, programming_experience, rule_confidence, knowledge_concept, diagnosis_version
) values (
  '22222222-2222-4222-8222-222222222222', 'yes', 'confident', 'structure_style', 'diagnosis-k/v1'
);
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}';

select results_eq(
  $$select user_id from public.user_diagnoses$$,
  array['22222222-2222-4222-8222-222222222222'::uuid],
  'user B cannot read user A row'
);

select * from finish();
rollback;
