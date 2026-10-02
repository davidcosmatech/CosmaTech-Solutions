-- Apply this migration to the existing project. The matching definitions are
-- also included at the end of schema.sql for new project setup.

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null default auth.uid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null default '',
  service_type text not null,
  estimated_price text not null default 'To be confirmed',
  details jsonb not null default '[]'::jsonb,
  description text not null default '',
  status text not null default 'New'
    check (status in ('New', 'Contacted', 'Quoted', 'Accepted', 'Declined')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quote_requests_details_array check (jsonb_typeof(details) = 'array')
);

create index if not exists quote_requests_created_at_idx
  on public.quote_requests (created_at desc);
create index if not exists quote_requests_user_id_idx
  on public.quote_requests (user_id, created_at desc);

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists "Users can check their own admin access" on public.admin_users;
create policy "Users can check their own admin access"
  on public.admin_users for select to authenticated
  using (user_id = auth.uid());

create or replace function public.is_site_admin()
returns boolean language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_site_admin() from public;
grant execute on function public.is_site_admin() to authenticated;

alter table public.quote_requests enable row level security;
revoke all on public.quote_requests from anon, authenticated;
grant insert (customer_name, customer_email, customer_phone, service_type,
              estimated_price, details, description)
  on public.quote_requests to anon, authenticated;
grant select, update on public.quote_requests to authenticated;

drop policy if exists "Visitors can submit quote requests" on public.quote_requests;
create policy "Visitors can submit quote requests"
  on public.quote_requests for insert to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists "Customers can read their own quote requests" on public.quote_requests;
create policy "Customers can read their own quote requests"
  on public.quote_requests for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "Admins can read all quote requests" on public.quote_requests;
create policy "Admins can read all quote requests"
  on public.quote_requests for select to authenticated
  using (public.is_site_admin());

drop policy if exists "Admins can update quote requests" on public.quote_requests;
create policy "Admins can update quote requests"
  on public.quote_requests for update to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid unique references public.quote_requests (id) on delete set null,
  title text not null,
  customer_name text not null default '',
  customer_email text not null default '',
  customer_phone text not null default '',
  description text not null default '',
  status text not null default 'To Do'
    check (status in ('To Do', 'In Progress', 'Waiting', 'Complete')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists jobs_status_due_date_idx
  on public.jobs (status, due_date);

alter table public.jobs enable row level security;
revoke all on public.jobs from anon, authenticated;
grant select, insert, update on public.jobs to authenticated;

drop policy if exists "Admins can read jobs" on public.jobs;
create policy "Admins can read jobs"
  on public.jobs for select to authenticated
  using (public.is_site_admin());

drop policy if exists "Admins can create jobs" on public.jobs;
create policy "Admins can create jobs"
  on public.jobs for insert to authenticated
  with check (public.is_site_admin());

drop policy if exists "Admins can update jobs" on public.jobs;
create policy "Admins can update jobs"
  on public.jobs for update to authenticated
  using (public.is_site_admin()) with check (public.is_site_admin());
