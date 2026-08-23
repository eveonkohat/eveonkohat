create table public.installment_customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  customer_code text not null default ('CUS-' || to_char(now(), 'YYYY') || '-' || floor(random() * 900000 + 100000)::text),
  name text not null,
  father_name text,
  cnic text,
  phone text,
  address text,
  guarantor_name text,
  guarantor_cnic text,
  guarantor_phone text,
  registration_date date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger installment_customers_set_updated_at
  before update on public.installment_customers
  for each row execute function public.set_updated_at();

create table public.installment_sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_code text not null default upper(substr(gen_random_uuid()::text, 1, 8)),
  customer_id uuid not null references public.installment_customers (id) on delete cascade,
  bike_id uuid references public.bikes (id) on delete set null,
  item_description text,
  sale_date date not null default current_date,
  total_amount numeric(14, 2) not null default 0,
  down_payment numeric(14, 2) not null default 0,
  term_months int not null default 12,
  per_installment numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  balance numeric(14, 2) not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'overdue')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger installment_sales_set_updated_at
  before update on public.installment_sales
  for each row execute function public.set_updated_at();

create table public.installment_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  installment_sale_id uuid not null references public.installment_sales (id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(14, 2) not null,
  account_id uuid references public.accounts (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.installment_terms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  title text not null,
  terms_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger installment_terms_set_updated_at
  before update on public.installment_terms
  for each row execute function public.set_updated_at();
