-- =============================================================================
-- بيانات لوحة المتابعة.
--
-- الريبو public، فالبيانات (الإنجازات، والمصروفات، والسداد) مكانها هنا مش في الكود.
-- صف واحد (key = 'status') فيه كل البيانات JSON، بنفس شكل src/data/types.ts.
--
-- RLS شغال ومن غير أي policies: المفتاح العام ما يقرا ولا يكتب.
-- القراية من سيرفر اللوحة بالمفتاح السري، والكتابة من scripts/push-data.mjs على جهاز أنس.
--
-- يتشغّل مرة واحدة في Supabase SQL Editor.
-- =============================================================================

create table if not exists public.dashboard_data (
  key         text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

alter table public.dashboard_data enable row level security;
revoke all on public.dashboard_data from anon, authenticated;

comment on table public.dashboard_data is
  'Management dashboard content (one JSON row, key = status). Server-side access only, no public policies.';
