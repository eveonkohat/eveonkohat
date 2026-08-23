create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  date date not null default current_date,
  category text not null,
  sub_category text,
  payment_account_id uuid references public.accounts (id) on delete set null,
  amount numeric(14, 2) not null default 0,
  description text,
  created_at timestamptz not null default now()
);
