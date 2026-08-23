-- Row Level Security: every business table is scoped to the caller's tenant.

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.parties enable row level security;
alter table public.accounts enable row level security;
alter table public.account_transactions enable row level security;
alter table public.purchases enable row level security;
alter table public.bikes enable row level security;
alter table public.purchase_returns enable row level security;
alter table public.other_items enable row level security;
alter table public.bike_sales enable row level security;
alter table public.pos_sales enable row level security;
alter table public.installment_customers enable row level security;
alter table public.installment_sales enable row level security;
alter table public.installment_payments enable row level security;
alter table public.installment_terms enable row level security;
alter table public.expenses enable row level security;

-- tenants -------------------------------------------------------------
create policy "tenant members can view their tenant"
  on public.tenants for select
  using (id = public.current_tenant_id());

create policy "tenant owner can update their tenant"
  on public.tenants for update
  using (id = public.current_tenant_id() and public.current_role() = 'tenant-owner')
  with check (id = public.current_tenant_id() and public.current_role() = 'tenant-owner');

-- profiles --------------------------------------------------------------
create policy "tenant members can view teammates"
  on public.profiles for select
  using (id = auth.uid() or tenant_id = public.current_tenant_id());

create policy "users can update their own profile"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "tenant owner can update teammate roles"
  on public.profiles for update
  using (tenant_id = public.current_tenant_id() and public.current_role() = 'tenant-owner')
  with check (tenant_id = public.current_tenant_id() and public.current_role() = 'tenant-owner');

create policy "tenant owner can remove teammates"
  on public.profiles for delete
  using (
    tenant_id = public.current_tenant_id()
    and public.current_role() = 'tenant-owner'
    and id <> auth.uid()
  );

-- generic helper macro (applied per table below): tenant isolation for
-- select / insert / update / delete using tenant_id = current_tenant_id()

create policy "tenant isolation: parties" on public.parties for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: accounts" on public.accounts for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: account_transactions" on public.account_transactions for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: purchases" on public.purchases for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: bikes" on public.bikes for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: purchase_returns" on public.purchase_returns for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: other_items" on public.other_items for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: bike_sales" on public.bike_sales for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: pos_sales" on public.pos_sales for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: installment_customers" on public.installment_customers for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: installment_sales" on public.installment_sales for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: installment_payments" on public.installment_payments for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: installment_terms" on public.installment_terms for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

create policy "tenant isolation: expenses" on public.expenses for all
  using (tenant_id = public.current_tenant_id())
  with check (tenant_id = public.current_tenant_id());

-- Factory reset: wipes all business data for the caller's tenant but keeps
-- the tenant row and the caller's own profile/login, mirroring the
-- "Danger Zone" behaviour in Settings > System Reset.
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
  delete from public.bike_sales where tenant_id = tid;
  delete from public.purchase_returns where tenant_id = tid;
  delete from public.bikes where tenant_id = tid;
  delete from public.other_items where tenant_id = tid;
  delete from public.purchases where tenant_id = tid;
  delete from public.account_transactions where tenant_id = tid;
  delete from public.accounts where tenant_id = tid;
  delete from public.parties where tenant_id = tid;
  delete from public.profiles where tenant_id = tid and id <> auth.uid();
end;
$$;
