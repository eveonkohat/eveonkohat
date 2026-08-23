# EveonKohat Bike SaaS

A premium showroom management application — inventory, purchases, sales, installment
plans, accounts/cash book, expenses, reports, and P&L — built with Next.js (App Router)
and Supabase.

## Stack

- Next.js 16 (App Router, Server Components, Server Actions, Turbopack)
- TypeScript
- Supabase (Postgres, Auth, Storage) via `@supabase/ssr`
- Tailwind CSS v4 + shadcn/ui
- React Hook Form + Zod
- Recharts

## 1. Configure Supabase

Copy `.env.local.example` (or edit `.env.local` directly) with your project's URL and
publishable/anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your anon/publishable key>
```

Never put the service-role key in `NEXT_PUBLIC_*` — if you need it (see
"User Management" below), set it server-only as `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Apply the database schema

Run every file in `supabase/migrations/` **in order** against your project — either
paste each one into the Supabase SQL Editor, or, with the Supabase CLI installed:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

This creates the multi-tenant schema (`tenants`, `profiles`, `bikes`, `purchases`,
`bike_sales`, `pos_sales`, `installment_*`, `accounts`, `account_transactions`,
`expenses`, `parties`, …), enables Row Level Security with tenant-isolation policies
on every table, and creates a few Postgres functions used by the app:

- `bootstrap_tenant_and_profile()` — auto-provisions a tenant + owner profile the
  first time a new auth user logs in.
- `post_ledger_entry(...)` / `transfer_between_accounts(...)` — atomic cash-book
  movements (used by Sales, Purchases, Expenses, Installments, Accounts).
- `adjust_party_balance(...)` — atomic supplier/party balance updates.
- `factory_reset_tenant()` — powers Settings → System Reset.

## 3. Create a login and seed sample data

1. In the Supabase dashboard: **Authentication → Users → Add user**, e.g.
   `demo@eveonkohat.com` with a password of your choice.
2. Run the app (`npm run dev`) and log in with that user once. This triggers
   `bootstrap_tenant_and_profile()`, creating your tenant + owner profile.
3. (Optional) Run `supabase/seed.sql` against your project to populate realistic
   demo data — sample stock, purchases, sales, installment customers, and expenses —
   for that tenant. It's idempotent and looks up the tenant by the email
   `demo@eveonkohat.com`, so adjust that in the script if you used a different email.

## 4. Run it

```bash
npm install
npm run dev    # http://localhost:3000
npm run build  # production build
```

## Architecture

- `app/(auth)/login` — email/password sign-in (Server Action), no public sign-up
  (matches the reference: users are provisioned, not self-registered).
- `app/(dashboard)/*` — every authenticated route, behind `proxy.ts` (Next 16's
  successor to `middleware.ts`), which redirects unauthenticated requests to
  `/login` and refreshes the Supabase session cookie on every request.
- `lib/supabase/{client,server,middleware}.ts` — SSR-safe Supabase clients.
- `lib/data/*` — read-only Server Component data fetchers, always tenant-scoped.
- `lib/actions/*` — Server Actions for all mutations, validated with Zod, tenant
  ownership re-verified server-side, RLS as the last line of defense.
- `types/database.ts` — hand-written types mirroring the SQL schema (no relational
  `select()` joins are used against the typed client — related rows are fetched
  separately and joined in application code, since the type layer doesn't model
  foreign-key relationships).

## Known differences from the reference app

- **Per-row invoice printing**: list pages have a real "Print" action (prints the
  current view) and a "View" action (real detail dialog with the record's fields),
  but there's no dedicated per-invoice print layout.
- **Add User (Settings → User Management)**: creating a new Supabase Auth user
  requires the Admin API, which requires a service-role key. That key is
  intentionally not included in this project (never put it in client code, and it
  wasn't provided). The action is wired up and will work once `SUPABASE_SERVICE_ROLE_KEY`
  is set server-side and the admin-invite call is implemented — right now it
  returns a clear, honest error rather than pretending to succeed.
- **Reports needing data this schema doesn't track** (Tax Report, Agent Commission,
  Staff Payroll) show an honest "not available yet" state explaining what model is
  missing, instead of fabricated numbers.
- **Government Verification** links out to a search query for the relevant
  province's official portal rather than a hardcoded government URL, since guessing
  live `.gov.pk` URLs isn't reliable.
- **Terms translator** (Installments → Terms): the reference's "Translate Online"
  feature needs a third-party translation API; that's out of scope here, so this
  clone keeps the real "Write Terms" functionality only.
