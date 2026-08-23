-- Rebrand: "bikes" -> "scooters" (the product is electric scooters, not bicycles).

alter table public.bikes rename to scooters;
alter table public.bike_sales rename to scooter_sales;

alter table public.purchase_returns rename column bike_id to scooter_id;
alter table public.scooter_sales rename column bike_id to scooter_id;
alter table public.installment_sales rename column bike_id to scooter_id;

alter trigger bikes_set_updated_at on public.scooters rename to scooters_set_updated_at;

alter index bikes_tenant_id_idx rename to scooters_tenant_id_idx;
alter index bikes_purchase_id_idx rename to scooters_purchase_id_idx;
alter index bikes_status_idx rename to scooters_status_idx;
alter index bikes_search_idx rename to scooters_search_idx;
alter index bike_sales_tenant_id_idx rename to scooter_sales_tenant_id_idx;
alter index bike_sales_date_idx rename to scooter_sales_date_idx;

alter policy "tenant isolation: bikes" on public.scooters rename to "tenant isolation: scooters";
alter policy "tenant isolation: bike_sales" on public.scooter_sales rename to "tenant isolation: scooter_sales";

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
