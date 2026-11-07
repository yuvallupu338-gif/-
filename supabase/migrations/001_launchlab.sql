-- LaunchLab production schema for Supabase Auth.
-- The app in this repository runs on local SQLite with its own accounts.
-- Apply this migration when connecting Supabase, then point the server at these tables.
-- Service-role keys stay on the server. Do not expose them to the browser.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  locale text not null default 'he',
  theme text not null default 'light',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  idea text not null,
  profile_json jsonb not null,
  generation_mode text not null,
  selected_brand_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analyses (
  project_id uuid primary key references public.projects (id) on delete cascade,
  content_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.plan_sections (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  section_key text not null,
  title text not null,
  content text not null,
  locked boolean not null default false,
  origin text not null,
  position integer not null,
  updated_at timestamptz not null default now(),
  unique (project_id, section_key)
);

create table if not exists public.brand_directions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  data_json jsonb not null,
  position integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.websites (
  project_id uuid primary key references public.projects (id) on delete cascade,
  data_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.finance_scenarios (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  scenario_key text not null,
  name text not null,
  assumptions_json jsonb not null,
  updated_at timestamptz not null default now(),
  unique (project_id, scenario_key)
);

create table if not exists public.marketing_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null,
  title text not null,
  content text not null,
  position integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.marketing_calendars (
  project_id uuid primary key references public.projects (id) on delete cascade,
  items_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.roadmap_tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  phase text not null,
  title text not null,
  notes text not null default '',
  priority text not null,
  done boolean not null default false,
  depends_on uuid,
  position integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.snapshots (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind text not null,
  data_json jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid,
  title text not null,
  body text not null,
  href text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  project_id uuid,
  kind text not null,
  status text not null,
  mode text not null,
  message text,
  created_at timestamptz not null default now()
);

create table if not exists public.exports (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.shares (
  project_id uuid primary key references public.projects (id) on delete cascade,
  token text not null unique,
  revoked boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count integer not null,
  primary key (user_id, day)
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.analyses enable row level security;
alter table public.plan_sections enable row level security;
alter table public.brand_directions enable row level security;
alter table public.websites enable row level security;
alter table public.finance_scenarios enable row level security;
alter table public.marketing_assets enable row level security;
alter table public.marketing_calendars enable row level security;
alter table public.roadmap_tasks enable row level security;
alter table public.snapshots enable row level security;
alter table public.notifications enable row level security;
alter table public.generations enable row level security;
alter table public.exports enable row level security;
alter table public.shares enable row level security;
alter table public.rate_limits enable row level security;

create policy profiles_owner on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy projects_owner on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy analyses_owner on public.analyses
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy plan_owner on public.plan_sections
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy brands_owner on public.brand_directions
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy websites_owner on public.websites
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy finance_owner on public.finance_scenarios
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy marketing_owner on public.marketing_assets
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy calendar_owner on public.marketing_calendars
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy tasks_owner on public.roadmap_tasks
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy snapshots_owner on public.snapshots
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy notifications_owner on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy generations_owner on public.generations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy exports_owner on public.exports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy shares_owner on public.shares
  for all using (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()))
  with check (exists (select 1 from public.projects p where p.id = project_id and p.user_id = auth.uid()));

create policy rate_owner on public.rate_limits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
