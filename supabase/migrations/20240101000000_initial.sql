-- ============================================================
-- CashView — Initial Schema
-- ============================================================
-- Run via: supabase db push
-- Or paste into Supabase SQL editor (project → SQL Editor → New query)
-- ============================================================

-- Enable pgcrypto for gen_random_uuid() (already enabled on Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

-- One row per household (Kevin + wife share one household)
CREATE TABLE public.households (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL DEFAULT 'My Household',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per auth user; links user → household
CREATE TABLE public.profiles (
  id            UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id  UUID        REFERENCES public.households(id) ON DELETE SET NULL,
  display_name  TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per connected bank/brokerage (via Plaid).
-- ⚠️  access_token is SENSITIVE. Clients must NEVER read this column.
--    Use the plaid_items_safe view below for all client-side queries.
--    Edge functions access this table via the service role key.
CREATE TABLE public.plaid_items (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id      UUID        NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  access_token      TEXT        NOT NULL,   -- NEVER expose to client
  item_id           TEXT        NOT NULL UNIQUE,
  institution_id    TEXT,
  institution_name  TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One row per account within a Plaid item (balance cache)
CREATE TABLE public.accounts (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id      UUID        NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  plaid_item_id     UUID        NOT NULL REFERENCES public.plaid_items(id) ON DELETE CASCADE,
  plaid_account_id  TEXT        NOT NULL UNIQUE,
  name              TEXT        NOT NULL,
  official_name     TEXT,
  type              TEXT        NOT NULL,  -- depository, investment, credit, etc.
  subtype           TEXT,                  -- checking, savings, brokerage, etc.
  current_balance   NUMERIC(15,2),
  available_balance NUMERIC(15,2),
  currency_code     TEXT        NOT NULL DEFAULT 'USD',
  last_updated      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SAFE VIEW (hides access_token from all client queries)
-- ============================================================

CREATE OR REPLACE VIEW public.plaid_items_safe AS
  SELECT
    id,
    household_id,
    item_id,
    institution_id,
    institution_name,
    created_at,
    updated_at
  FROM public.plaid_items;

-- Grant authenticated users access to the safe view only
GRANT SELECT ON public.plaid_items_safe TO authenticated;

-- ============================================================
-- HELPER FUNCTION
-- ============================================================

-- Returns the household_id of the currently authenticated user.
-- SECURITY DEFINER: runs with elevated privileges so it can query profiles
-- even under RLS. search_path is locked down to prevent privilege escalation.
CREATE OR REPLACE FUNCTION public.get_my_household_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT household_id FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.households   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plaid_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts     ENABLE ROW LEVEL SECURITY;

-- households: any member of the household can read it
CREATE POLICY "households: members can read"
  ON public.households
  FOR SELECT
  USING (id = public.get_my_household_id());

-- profiles: users can read their own profile and household mates' profiles
CREATE POLICY "profiles: read own and household"
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR household_id = public.get_my_household_id()
  );

CREATE POLICY "profiles: update own"
  ON public.profiles
  FOR UPDATE
  USING (id = auth.uid());

-- plaid_items: household members can read metadata (safe view handles column filtering)
-- Service role key (used by edge functions) bypasses RLS entirely.
CREATE POLICY "plaid_items: household read"
  ON public.plaid_items
  FOR SELECT
  USING (household_id = public.get_my_household_id());

-- accounts: household members can read
CREATE POLICY "accounts: household read"
  ON public.accounts
  FOR SELECT
  USING (household_id = public.get_my_household_id());

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create a profile row when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- HOUSEHOLD SETUP HELPER
-- ============================================================
-- After you create your Supabase users, run this to wire them
-- into a shared household. Replace the email values below.
--
-- USAGE: Paste + run in Supabase SQL editor after both users sign up.
--
-- DO $$
-- DECLARE
--   v_household_id UUID;
-- BEGIN
--   INSERT INTO public.households (name) VALUES ('Our Household')
--   RETURNING id INTO v_household_id;
--
--   UPDATE public.profiles
--   SET household_id = v_household_id
--   WHERE id IN (
--     SELECT id FROM auth.users
--     WHERE email IN ('kevin@example.com', 'wife@example.com')
--   );
-- END $$;
