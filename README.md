# CashView — Household Cash Dashboard

A live, shared view of your household's cash across all accounts. Built with Expo (React Native), Supabase, and Plaid.

## Architecture

```
Expo app (web + iOS/Android)
    │
    ├── Supabase Auth  (magic-link, session storage)
    ├── Supabase DB    (Postgres + Row Level Security)
    └── Supabase Edge Functions  ← Plaid API calls happen here only
            ├── plaid-create-link-token
            ├── plaid-exchange-token
            └── plaid-sync-balances
```

Your Plaid `access_token` and `secret` never touch the frontend or leave the server.

---

## Prerequisites

| Tool | Install |
|------|---------|
| Node ≥ 18 | [nodejs.org](https://nodejs.org) |
| Supabase CLI | `brew install supabase/tap/supabase` |
| Expo CLI | Included via `npx expo` — no separate install needed |

---

## Accounts you need

### 1. Supabase project

1. Go to [supabase.com](https://supabase.com) → **New project**
2. Once created, go to **Settings → API** and copy:
   - **Project URL** → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon / public key** → `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` *(keep this secret)*
3. Go to **Authentication → URL Configuration** and add these to **Redirect URLs**:
   ```
   http://localhost:8081
   cashview://
   ```

### 2. Plaid account (sandbox)

1. Create a free account at [dashboard.plaid.com](https://dashboard.plaid.com)
2. Go to **Team Settings → Keys**
3. Copy:
   - **client_id** → `PLAID_CLIENT_ID`
   - **Sandbox secret** → `PLAID_SECRET`

> **Morgan Stanley brokerage note:** Plaid's sandbox includes a generic "Tartan Bank Investment" test institution that covers brokerage/investment account types. Real Morgan Stanley connections use OAuth and require Plaid's *development* tier (free up to 100 items). Test the investment account type early in sandbox — if Plaid returns balance as `null` for investment accounts, it means the institution uses holdings-based data (via the Investments product) rather than a direct balance endpoint. In that case, adding `investments` to the products array in `plaid-create-link-token` and calling `/investments/holdings/get` on the backend resolves it. This is flagged here so you know before building on top of it.

---

## Setup

### Step 1 — Clone and install

```bash
git clone <your-repo>
cd cashview
npm install
```

### Step 2 — Environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in all values. The file documents what each key is and where to get it.

### Step 3 — Push the database schema

**Option A (Supabase CLI — recommended):**
```bash
supabase link --project-ref your-project-ref
supabase db push
```

**Option B (SQL editor):**
1. Open your Supabase project → **SQL Editor → New query**
2. Paste the contents of `supabase/migrations/20240101000000_initial.sql`
3. Run it

### Step 4 — Create your household

After both you and your wife sign up (step 7), run this SQL in the Supabase SQL editor. Replace the email addresses:

```sql
DO $$
DECLARE
  v_household_id UUID;
BEGIN
  INSERT INTO public.households (name) VALUES ('Our Household')
  RETURNING id INTO v_household_id;

  UPDATE public.profiles
  SET household_id = v_household_id
  WHERE id IN (
    SELECT id FROM auth.users
    WHERE email IN ('kevin@example.com', 'wife@example.com')
  );
END $$;
```

### Step 5 — Deploy edge functions

```bash
# Link your project if you haven't
supabase link --project-ref your-project-ref

# Set secrets (Plaid credentials — never committed to repo)
supabase secrets set PLAID_CLIENT_ID=your-plaid-client-id
supabase secrets set PLAID_SECRET=your-plaid-sandbox-secret
supabase secrets set PLAID_ENV=sandbox

# Deploy all three functions
supabase functions deploy plaid-create-link-token
supabase functions deploy plaid-exchange-token
supabase functions deploy plaid-sync-balances
```

### Step 6 — Run the app (web)

```bash
npm run web
# Opens at http://localhost:8081
```

### Step 7 — Sign up

1. Open [http://localhost:8081](http://localhost:8081)
2. Enter your email → check for magic link → click it → you're in
3. Your wife does the same from her device
4. Run the household SQL from Step 4

### Step 8 — Connect accounts (Plaid sandbox)

Click **+ Add account**. In Plaid sandbox, use these test credentials:

| Field | Value |
|-------|-------|
| Any institution search | Type any name, pick any result |
| Username | `user_good` |
| Password | `pass_good` |

For a **brokerage/investment account** (Morgan Stanley equivalent in sandbox):
- Search for **"Tartan Brokerage"** or any institution, then select an account type of "Investment"
- Username: `user_good`, Password: `pass_good`
- After linking, check the balance returned — if `current_balance` is null, see the Morgan Stanley note above

---

## Running on iOS/Android (future)

The Plaid SDK has native dependencies. To run on device:

```bash
# Generate native projects
npm run prebuild

# Build with EAS (recommended)
npm install -g eas-cli
eas build --platform ios   # or android
```

Or run locally with a dev client:
```bash
npx expo run:ios
npx expo run:android
```

---

## Switching from sandbox to production

1. Get approved for Plaid development/production tier
2. Update your Supabase secrets:
   ```bash
   supabase secrets set PLAID_SECRET=your-production-secret
   supabase secrets set PLAID_ENV=production
   ```
3. Redeploy the edge functions
4. No frontend changes needed

---

## Future work (out of scope for v1)

- Transaction history and categorization
- Spending trends and charts over time
- Budget tracking
- Push notifications for balance thresholds
- Automatic background sync (scheduled edge function)
- Net worth tracking (include liabilities)

---

## Project structure

```
cashview/
├── app/
│   ├── _layout.tsx              Root layout + auth gate
│   ├── (auth)/
│   │   └── login.tsx            Magic-link login
│   └── (app)/
│       └── index.tsx            Dashboard
├── components/
│   ├── AccountCard.tsx          Per-account balance card
│   └── TotalBanner.tsx          Total household cash header
├── lib/
│   ├── supabase.ts              Supabase client
│   ├── useAuth.tsx              Auth context
│   └── api.ts                   Edge function wrappers
├── supabase/
│   ├── config.toml              Local dev config
│   ├── migrations/
│   │   └── 20240101000000_initial.sql   Schema + RLS
│   └── functions/
│       ├── plaid-create-link-token/
│       ├── plaid-exchange-token/
│       └── plaid-sync-balances/
├── types/
│   └── database.ts              DB type definitions
├── .env.example                 ← copy to .env, fill in credentials
├── .gitignore                   env files excluded
├── app.json
└── package.json
```
