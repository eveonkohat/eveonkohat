-- Atomically adjusts a party's running balance (what we owe them, or they owe us).
create or replace function public.adjust_party_balance(
  p_tenant_id uuid,
  p_party_id uuid,
  p_delta numeric
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

  update public.parties
  set current_balance = current_balance + p_delta
  where id = p_party_id and tenant_id = p_tenant_id;
end;
$$;
