create index parties_tenant_id_idx on public.parties (tenant_id);
create index accounts_tenant_id_idx on public.accounts (tenant_id);
create index account_transactions_tenant_id_idx on public.account_transactions (tenant_id);
create index account_transactions_account_id_idx on public.account_transactions (account_id);
create index account_transactions_date_idx on public.account_transactions (date);

create index purchases_tenant_id_idx on public.purchases (tenant_id);
create index purchases_party_id_idx on public.purchases (party_id);

create index bikes_tenant_id_idx on public.bikes (tenant_id);
create index bikes_purchase_id_idx on public.bikes (purchase_id);
create index bikes_status_idx on public.bikes (status);
create index bikes_search_idx on public.bikes using gin (
  to_tsvector('simple', coalesce(make, '') || ' ' || coalesce(model, '') || ' ' || coalesce(chassis_no, '') || ' ' || coalesce(color, ''))
);

create index purchase_returns_tenant_id_idx on public.purchase_returns (tenant_id);

create index other_items_tenant_id_idx on public.other_items (tenant_id);

create index bike_sales_tenant_id_idx on public.bike_sales (tenant_id);
create index bike_sales_date_idx on public.bike_sales (date);

create index pos_sales_tenant_id_idx on public.pos_sales (tenant_id);
create index pos_sales_date_idx on public.pos_sales (date);

create index installment_customers_tenant_id_idx on public.installment_customers (tenant_id);
create index installment_sales_tenant_id_idx on public.installment_sales (tenant_id);
create index installment_sales_customer_id_idx on public.installment_sales (customer_id);
create index installment_payments_tenant_id_idx on public.installment_payments (tenant_id);
create index installment_payments_sale_id_idx on public.installment_payments (installment_sale_id);
create index installment_terms_tenant_id_idx on public.installment_terms (tenant_id);

create index expenses_tenant_id_idx on public.expenses (tenant_id);
create index expenses_date_idx on public.expenses (date);
