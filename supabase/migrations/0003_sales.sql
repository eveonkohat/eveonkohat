-- Bike sales: one row per bike sold
create table public.bike_sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_code text not null default upper(substr(gen_random_uuid()::text, 1, 8)),
  bike_id uuid references public.bikes (id) on delete set null,
  customer_name text not null,
  customer_cnic text,
  customer_phone text,
  date date not null default current_date,
  total_amount numeric(14, 2) not null default 0,
  received_amount numeric(14, 2) not null default 0,
  balance numeric(14, 2) not null default 0,
  payment_status text not null default 'pending' check (payment_status in ('received', 'partial', 'pending')),
  payment_account_id uuid references public.accounts (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

-- POS sales: general point-of-sale invoices with free-form line items
create table public.pos_sales (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_code text not null default upper(substr(gen_random_uuid()::text, 1, 8)),
  customer_name text not null default 'Cash Customer',
  customer_phone text,
  date date not null default current_date,
  items jsonb not null default '[]',
  terms_and_conditions text,
  grand_total numeric(14, 2) not null default 0,
  received_amount numeric(14, 2) not null default 0,
  balance numeric(14, 2) not null default 0,
  payment_account_id uuid references public.accounts (id) on delete set null,
  invoice_notes text,
  payment_slip_url text,
  created_at timestamptz not null default now()
);
