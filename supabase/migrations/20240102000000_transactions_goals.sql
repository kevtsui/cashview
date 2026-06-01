-- ============================================================
-- CashView — Transactions + Goals
-- Run via: supabase db push
-- Or paste into Supabase SQL Editor
-- ============================================================

-- ── Transactions (Plaid transaction data) ─────────────────────────────────────
CREATE TABLE public.transactions (
  id                        UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id              UUID        NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  plaid_account_id          TEXT        NOT NULL,
  plaid_transaction_id      TEXT        NOT NULL UNIQUE,
  merchant_name             TEXT,
  name                      TEXT        NOT NULL,
  personal_finance_category TEXT,         -- e.g. FOOD_AND_DRINK, TRANSPORTATION
  category_primary          TEXT,         -- top-level category label
  amount                    NUMERIC(15,2) NOT NULL,  -- positive=debit, negative=credit
  date                      DATE        NOT NULL,
  pending                   BOOLEAN     NOT NULL DEFAULT FALSE,
  currency_code             TEXT        DEFAULT 'USD',
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions: household read"
  ON public.transactions FOR SELECT
  USING (household_id = public.get_my_household_id());

CREATE INDEX transactions_household_date
  ON public.transactions (household_id, date DESC);

CREATE INDEX transactions_account
  ON public.transactions (plaid_account_id);

-- ── Goals (user-defined savings goals) ────────────────────────────────────────
CREATE TABLE public.goals (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id      UUID        NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  name              TEXT        NOT NULL,
  target_amount     NUMERIC(15,2) NOT NULL,
  saved_amount      NUMERIC(15,2) NOT NULL DEFAULT 0,
  color             TEXT        NOT NULL DEFAULT '#E5634A',
  icon              TEXT        NOT NULL DEFAULT 'target',
  sort_order        INTEGER     NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

-- Household members can read goals
CREATE POLICY "goals: household read"
  ON public.goals FOR SELECT
  USING (household_id = public.get_my_household_id());

-- Household members can insert goals
CREATE POLICY "goals: household insert"
  ON public.goals FOR INSERT
  WITH CHECK (household_id = public.get_my_household_id());

-- Household members can update their goals
CREATE POLICY "goals: household update"
  ON public.goals FOR UPDATE
  USING (household_id = public.get_my_household_id());

-- Household members can delete their goals
CREATE POLICY "goals: household delete"
  ON public.goals FOR DELETE
  USING (household_id = public.get_my_household_id());
