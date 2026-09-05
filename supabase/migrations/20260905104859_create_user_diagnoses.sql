create table public.user_diagnoses (
  user_id uuid primary key,
  programming_experience text not null
    constraint user_diagnoses_programming_experience_check
      check (programming_experience in ('yes', 'no')),
  rule_confidence text not null
    constraint user_diagnoses_rule_confidence_check
      check (rule_confidence in ('none', 'low', 'partial', 'confident')),
  knowledge_concept text not null
    constraint user_diagnoses_knowledge_concept_check
      check (knowledge_concept in ('visual_only', 'unknown', 'somewhat', 'structure_style')),
  diagnosis_version text not null
    constraint user_diagnoses_diagnosis_version_check
      check (length(btrim(diagnosis_version)) > 0),
  completed_at timestamptz not null default statement_timestamp(),
  updated_at timestamptz not null default statement_timestamp()
);

comment on table public.user_diagnoses is
  'D-022 K-group diagnosis: one current record per authenticated user.';

create function public.set_user_diagnosis_timestamps()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_at timestamptz := statement_timestamp();
begin
  new.completed_at := saved_at;
  new.updated_at := saved_at;
  return new;
end;
$$;

create trigger set_user_diagnosis_timestamps
before insert or update on public.user_diagnoses
for each row execute function public.set_user_diagnosis_timestamps();

alter table public.user_diagnoses enable row level security;

create policy "Users can read their own diagnosis"
on public.user_diagnoses
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own diagnosis"
on public.user_diagnoses
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own diagnosis"
on public.user_diagnoses
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on table public.user_diagnoses from public, anon, authenticated;
grant select, insert, update on table public.user_diagnoses to authenticated;

revoke all on function public.set_user_diagnosis_timestamps() from public, anon, authenticated;
