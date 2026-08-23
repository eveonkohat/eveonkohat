-- Development seed data.
--
-- This script does NOT create a Supabase Auth user (that requires the
-- service-role key, which this project intentionally keeps out of the
-- codebase). Before running this seed:
--
--   1. In the Supabase dashboard, go to Authentication > Users > Add user
--      and create a user (e.g. demo@eveonkohat.com / a password of your choice).
--   2. Log into the app once with that user. The first authenticated
--      request calls public.bootstrap_tenant_and_profile(), which creates
--      the tenant + profile row automatically.
--   3. Run this seed script (via `supabase db execute` or the SQL editor).
--
-- It is idempotent per tenant: re-running it clears and re-inserts the
-- demo tenant's business data without touching auth.users or profiles.

do $$
declare
  demo_tenant_id uuid;
  cash_account_id uuid;
  bank_account_id uuid;
  party_supplier_id uuid;
  purchase_s1_id uuid;
  purchase_omigo_id uuid;
  purchase_nisa_id uuid;
  bike_s1_1 uuid;
  bike_s1_2 uuid;
  bike_s1_3 uuid;
  bike_omigo_1 uuid;
  bike_omigo_2 uuid;
  bike_omigo_3 uuid;
  bike_nisa_1 uuid;
  bike_nisa_2 uuid;
  customer_awais_id uuid;
  customer_sajid_id uuid;
  installment_sale_id uuid;
begin
  select tenant_id into demo_tenant_id
  from public.profiles
  where email = 'demo@eveonkohat.com'
  limit 1;

  if demo_tenant_id is null then
    raise notice 'No profile found for demo@eveonkohat.com yet. Create the auth user and log in once before seeding.';
    return;
  end if;

  -- Clear any previous seed run for this tenant.
  delete from public.installment_payments where tenant_id = demo_tenant_id;
  delete from public.installment_sales where tenant_id = demo_tenant_id;
  delete from public.installment_customers where tenant_id = demo_tenant_id;
  delete from public.installment_terms where tenant_id = demo_tenant_id;
  delete from public.expenses where tenant_id = demo_tenant_id;
  delete from public.pos_sales where tenant_id = demo_tenant_id;
  delete from public.bike_sales where tenant_id = demo_tenant_id;
  delete from public.purchase_returns where tenant_id = demo_tenant_id;
  delete from public.bikes where tenant_id = demo_tenant_id;
  delete from public.other_items where tenant_id = demo_tenant_id;
  delete from public.purchases where tenant_id = demo_tenant_id;
  delete from public.account_transactions where tenant_id = demo_tenant_id;
  delete from public.accounts where tenant_id = demo_tenant_id;
  delete from public.parties where tenant_id = demo_tenant_id;

  update public.tenants
  set name = 'Awami Motors',
      owner_name = 'Demo Owner',
      phone = '0335-4582969',
      address = 'Khawaja Safdar Road near Dar ul Shifa Hospital, CSD Chowk, Sialkot Cantt',
      plan_type = 'Standard',
      showroom_type = 'Electric Bikes',
      status = 'Active',
      max_users = 5,
      max_vehicles = 500
  where id = demo_tenant_id;

  -- Accounts -------------------------------------------------------------
  insert into public.accounts (tenant_id, type, name, address, opening_balance, current_balance)
  values (demo_tenant_id, 'cash', 'Cash in Hand', 'Head Office', 0, 430000)
  returning id into cash_account_id;

  insert into public.accounts (tenant_id, type, name, address, opening_balance, current_balance)
  values (demo_tenant_id, 'bank', 'Meezan Bank - Main', 'Sialkot Cantt Branch', 0, 250000)
  returning id into bank_account_id;

  -- Parties ----------------------------------------------------------------
  insert into public.parties (tenant_id, name, contact_person, phone, address, opening_balance, current_balance)
  values (demo_tenant_id, 'Evee Motors Distribution', 'Fazal Shaikh', '0300-1234567', 'Lahore', 0, 0)
  returning id into party_supplier_id;

  -- Purchases + bikes --------------------------------------------------------
  insert into public.purchases (tenant_id, party_id, date, vehicle_type, make, model, color, year, purchase_price, quantity, total_amount, paid_amount, balance, status)
  values (demo_tenant_id, party_supplier_id, '2026-08-21', 'Electric', 'Evee', 'S1', 'Red', 2026, 206000, 3, 618000, 618000, 0, 'in-stock')
  returning id into purchase_s1_id;

  insert into public.purchases (tenant_id, party_id, date, vehicle_type, make, model, color, year, purchase_price, quantity, total_amount, paid_amount, balance, status)
  values (demo_tenant_id, party_supplier_id, '2026-08-21', 'Electric', 'OKLA', 'OMIGO', 'Black', 2026, 230000, 3, 690000, 690000, 0, 'in-stock')
  returning id into purchase_omigo_id;

  insert into public.purchases (tenant_id, party_id, date, vehicle_type, make, model, color, year, purchase_price, quantity, total_amount, paid_amount, balance, status)
  values (demo_tenant_id, party_supplier_id, '2026-08-23', 'Electric', 'Evee', 'Nisa', 'White', 2026, 145001, 2, 290002, 290002, 0, 'in-stock')
  returning id into purchase_nisa_id;

  insert into public.bikes (tenant_id, purchase_id, make, model, year, color, vehicle_type, purchase_price, status)
  values
    (demo_tenant_id, purchase_s1_id, 'Evee', 'S1', 2026, 'Red', 'Electric', 206000, 'sold') returning id into bike_s1_1;
  insert into public.bikes (tenant_id, purchase_id, make, model, year, color, vehicle_type, purchase_price, status)
  values (demo_tenant_id, purchase_s1_id, 'Evee', 'S1', 2026, 'Red', 'Electric', 206000, 'sold') returning id into bike_s1_2;
  insert into public.bikes (tenant_id, purchase_id, make, model, year, color, vehicle_type, purchase_price, status)
  values (demo_tenant_id, purchase_s1_id, 'Evee', 'S1', 2026, 'Red', 'Electric', 206000, 'in_stock') returning id into bike_s1_3;

  insert into public.bikes (tenant_id, purchase_id, make, model, year, color, vehicle_type, purchase_price, status)
  values (demo_tenant_id, purchase_omigo_id, 'OKLA', 'OMIGO', 2026, 'Black', 'Electric', 230000, 'sold') returning id into bike_omigo_1;
  insert into public.bikes (tenant_id, purchase_id, make, model, year, color, vehicle_type, purchase_price, status)
  values (demo_tenant_id, purchase_omigo_id, 'OKLA', 'OMIGO', 2026, 'Black', 'Electric', 230000, 'in_stock') returning id into bike_omigo_2;
  insert into public.bikes (tenant_id, purchase_id, make, model, year, color, vehicle_type, purchase_price, status)
  values (demo_tenant_id, purchase_omigo_id, 'OKLA', 'OMIGO', 2026, 'Black', 'Electric', 230000, 'in_stock') returning id into bike_omigo_3;

  insert into public.bikes (tenant_id, purchase_id, make, model, year, color, vehicle_type, chassis_no, engine_no, purchase_price, status)
  values (demo_tenant_id, purchase_nisa_id, 'Evee', 'Nisa', 2026, 'White', 'Electric', 'GH12345678910', 'AS12345678911', 145001, 'sold') returning id into bike_nisa_1;
  insert into public.bikes (tenant_id, purchase_id, make, model, year, color, vehicle_type, purchase_price, status)
  values (demo_tenant_id, purchase_nisa_id, 'Evee', 'Nisa', 2026, 'White', 'Electric', 145001, 'in_stock') returning id into bike_nisa_2;

  -- Other stock items ----------------------------------------------------
  insert into public.other_items (tenant_id, date, item_name, quantity, quantity_remaining, unit_price, total_amount, paid_amount, balance, payment_account_id, description)
  values
    (demo_tenant_id, '2026-08-18', 'CULTUS 2020', 1, 1, 2780000, 2780000, 2780000, 0, cash_account_id, 'Purchase from Fazal Shaikh c/o Zubair Memon'),
    (demo_tenant_id, '2026-08-18', 'GLI 2018 (BMM-435)', 1, 1, 3600000, 3600000, 2000000, 1600000, cash_account_id, 'From Parvez Korai and Zubair Memon');

  -- Bike sales -------------------------------------------------------------
  insert into public.bike_sales (tenant_id, bike_id, customer_name, customer_cnic, customer_phone, date, total_amount, received_amount, balance, payment_status, payment_account_id)
  values (demo_tenant_id, bike_nisa_1, 'SAEED', '2164616546', '212065165120', '2026-08-23', 159000, 159000, 0, 'received', cash_account_id);

  insert into public.bike_sales (tenant_id, bike_id, customer_name, customer_cnic, customer_phone, date, total_amount, received_amount, balance, payment_status)
  values (demo_tenant_id, bike_s1_1, 'Asim haroon', '1430122918819', '03339510061', '2026-08-22', 216000, 0, 216000, 'partial');

  -- Installments -------------------------------------------------------------
  insert into public.installment_customers (tenant_id, name, father_name, cnic, phone, registration_date)
  values (demo_tenant_id, 'AWAIS', 'AMIN', '34104-2514257-8', '03216498651', '2026-08-23')
  returning id into customer_awais_id;

  insert into public.installment_customers (tenant_id, name, father_name, cnic, phone, registration_date)
  values (demo_tenant_id, 'saeed', 'Abdul Hameed', '1465498465168', '58456465', '2026-08-20');

  insert into public.installment_customers (tenant_id, name, father_name, cnic, phone, registration_date)
  values (demo_tenant_id, 'Muhammad Sajid Ali', 'Shabbir Ahmad', '3230323471011', '03336005623', '2026-07-01')
  returning id into customer_sajid_id;

  insert into public.installment_sales (tenant_id, customer_id, bike_id, item_description, sale_date, total_amount, down_payment, term_months, per_installment, paid_amount, balance, status)
  values (demo_tenant_id, customer_awais_id, bike_s1_2, 'Evee S1', '2026-08-23', 216000, 50000, 12, 13833, 216000, 0, 'completed')
  returning id into installment_sale_id;

  insert into public.installment_payments (tenant_id, installment_sale_id, payment_date, amount, account_id, notes)
  values (demo_tenant_id, installment_sale_id, '2026-08-24', 216000, cash_account_id, 'Full settlement');

  insert into public.installment_sales (tenant_id, customer_id, bike_id, item_description, sale_date, total_amount, down_payment, term_months, per_installment, paid_amount, balance, status)
  values (demo_tenant_id, customer_sajid_id, bike_omigo_1, 'OKLA OMIGO', '2026-08-22', 240000, 0, 6, 40000, 105000, 135000, 'active')
  returning id into installment_sale_id;

  insert into public.installment_payments (tenant_id, installment_sale_id, payment_date, amount, account_id, notes)
  values (demo_tenant_id, installment_sale_id, '2026-08-24', 25000, cash_account_id, 'Installment payment from Muhammad Sajid Ali for OKLA OMIGO');

  insert into public.installment_terms (tenant_id, title, terms_text)
  values (demo_tenant_id, 'Installment Agreement Terms',
    E'1. The buyer agrees to pay the remaining balance in equal monthly installments.\n2. Late payments beyond 15 days may incur a penalty.\n3. Ownership documents will be transferred only after full payment.');

  -- Expenses / income examples ---------------------------------------------
  insert into public.expenses (tenant_id, date, category, sub_category, payment_account_id, amount, description)
  values
    (demo_tenant_id, '2026-08-10', 'Rent & Utilities', 'Shop Rent', cash_account_id, 45000, 'Monthly shop rent'),
    (demo_tenant_id, '2026-08-12', 'Rent & Utilities', 'Electricity Bill', cash_account_id, 12500, 'Monthly electricity bill');

  raise notice 'Seed data loaded for tenant %', demo_tenant_id;
end $$;
