-- Atomically records a cash-book movement and adjusts the account balance.
-- Centralizing this in one function means every mutation that touches money
-- (purchases, sales, expenses, transfers, installment payments) goes through
-- the same atomic path instead of racy read-modify-write updates from the app.
create or replace function public.post_ledger_entry(
  p_tenant_id uuid,
  p_account_id uuid,
  p_direction text,
  p_amount numeric,
  p_category text,
  p_description text,
  p_source_type text,
  p_source_id uuid default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_tenant_id <> public.current_tenant_id() then
    raise exception 'Tenant mismatch';
  end if;

  if p_amount <= 0 then
    return;
  end if;

  insert into public.account_transactions
    (tenant_id, account_id, date, direction, category, description, amount, source_type, source_id)
  values
    (p_tenant_id, p_account_id, current_date, p_direction, p_category, p_description, p_amount, p_source_type, p_source_id);

  update public.accounts
  set current_balance = current_balance + (case when p_direction = 'in' then p_amount else -p_amount end)
  where id = p_account_id and tenant_id = p_tenant_id;
end;
$$;

-- Moves funds between two of the tenant's own accounts atomically.
create or replace function public.transfer_between_accounts(
  p_tenant_id uuid,
  p_from_account_id uuid,
  p_to_account_id uuid,
  p_amount numeric,
  p_note text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if p_tenant_id <> public.current_tenant_id() then
    raise exception 'Tenant mismatch';
  end if;

  if p_amount <= 0 then
    raise exception 'Transfer amount must be greater than zero';
  end if;

  perform public.post_ledger_entry(
    p_tenant_id, p_from_account_id, 'out', p_amount, 'Transfer', coalesce(p_note, 'Transfer out'), 'transfer', p_to_account_id
  );
  perform public.post_ledger_entry(
    p_tenant_id, p_to_account_id, 'in', p_amount, 'Transfer', coalesce(p_note, 'Transfer in'), 'transfer', p_from_account_id
  );
end;
$$;
