-- Customer & Payment Management: per-payment history for scooter sales, so a
-- sale made with a partial payment can receive further payments over time
-- (mirrors how installment_payments already works for installment_sales).

create table public.scooter_sale_payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  scooter_sale_id uuid not null references public.scooter_sales (id) on delete cascade,
  payment_date date not null default current_date,
  amount numeric(14, 2) not null,
  payment_method text not null default 'Cash',
  account_id uuid references public.accounts (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index scooter_sale_payments_tenant_id_idx on public.scooter_sale_payments (tenant_id);
create index scooter_sale_payments_sale_id_idx on public.scooter_sale_payments (scooter_sale_id);

alter table public.scooter_sale_payments enable row level security;

create policy "tenant isolation: scooter_sale_payments" on public.scooter_sale_payments for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- Explicit payment method alongside the existing account link, for both
-- scooter sales and installment payments (the account only tells you which
-- cash/bank ledger it landed in, not how the customer actually paid).
alter table public.installment_payments add column payment_method text not null default 'Cash';

create or replace function public.factory_reset_tenant()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  tid uuid := public.current_tenant_id();
begin
  if public.current_role() <> 'tenant-owner' then
    raise exception 'Only the tenant owner can perform a factory reset';
  end if;

  delete from public.installment_payments where tenant_id = tid;
  delete from public.installment_sales where tenant_id = tid;
  delete from public.installment_customers where tenant_id = tid;
  delete from public.installment_terms where tenant_id = tid;
  delete from public.expenses where tenant_id = tid;
  delete from public.pos_sales where tenant_id = tid;
  delete from public.scooter_sale_payments where tenant_id = tid;
  delete from public.scooter_sales where tenant_id = tid;
  delete from public.purchase_returns where tenant_id = tid;
  delete from public.scooters where tenant_id = tid;
  delete from public.other_items where tenant_id = tid;
  delete from public.purchases where tenant_id = tid;
  delete from public.account_transactions where tenant_id = tid;
  delete from public.accounts where tenant_id = tid;
  delete from public.parties where tenant_id = tid;
  delete from public.profiles where tenant_id = tid and id <> auth.uid();
end;
$$;
