-- Parties: suppliers / other counterparties with a running balance
create table public.parties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  name text not null,
  contact_person text,
  phone text,
  address text,
  opening_balance numeric(14, 2) not null default 0,
  current_balance numeric(14, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger parties_set_updated_at
  before update on public.parties
  for each row execute function public.set_updated_at();

-- Accounts: cash / bank ledgers
create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  type text not null check (type in ('cash', 'bank')),
  name text not null,
  address text,
  opening_balance numeric(14, 2) not null default 0,
  current_balance numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

-- Account transactions: the cash book / ledger feed
create table public.account_transactions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  account_id uuid references public.accounts (id) on delete set null,
  to_account_id uuid references public.accounts (id) on delete set null,
  date date not null default current_date,
  direction text not null check (direction in ('in', 'out')),
  category text,
  description text,
  amount numeric(14, 2) not null,
  source_type text not null default 'manual'
    check (source_type in ('sale', 'purchase', 'expense', 'installment_payment', 'transfer', 'other_income', 'manual')),
  source_id uuid,
  created_at timestamptz not null default now()
);

-- Purchases: one row per acquisition batch (bike or other stock)
create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  order_code text not null default upper(substr(gen_random_uuid()::text, 1, 8)),
  party_id uuid references public.parties (id) on delete set null,
  date date not null default current_date,
  vehicle_type text not null default 'Electric',
  make text not null,
  model text not null,
  color text,
  year int,
  purchase_price numeric(14, 2) not null default 0,
  tax_per_unit numeric(14, 2) not null default 0,
  carriage_per_unit numeric(14, 2) not null default 0,
  quantity int not null default 1,
  total_amount numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  balance numeric(14, 2) not null default 0,
  status text not null default 'in-stock',
  notes text,
  created_at timestamptz not null default now()
);

-- Bikes: one row per physical unit in stock
create table public.bikes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  purchase_id uuid references public.purchases (id) on delete set null,
  make text not null,
  model text not null,
  year int,
  color text,
  vehicle_type text not null default 'Electric',
  chassis_no text,
  engine_no text,
  purchase_price numeric(14, 2) not null default 0,
  sold_price numeric(14, 2),
  status text not null default 'in_stock' check (status in ('in_stock', 'sold', 'returned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger bikes_set_updated_at
  before update on public.bikes
  for each row execute function public.set_updated_at();

-- Purchase returns
create table public.purchase_returns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  bike_id uuid not null references public.bikes (id) on delete cascade,
  return_date date not null default current_date,
  agreed_return_amount numeric(14, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

-- Other (non-bike) items: purchase batch and stock record combined
create table public.other_items (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  party_id uuid references public.parties (id) on delete set null,
  date date not null default current_date,
  item_name text not null,
  quantity int not null default 1,
  quantity_remaining int not null default 1,
  unit_price numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  paid_amount numeric(14, 2) not null default 0,
  balance numeric(14, 2) not null default 0,
  payment_account_id uuid references public.accounts (id) on delete set null,
  description text,
  created_at timestamptz not null default now()
);
