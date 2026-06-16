-- ============================================================
-- NANOBANANA - FULL SUPABASE SETUP FOR NEW PROJECT
-- Run this entire script in the Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New Query -> Paste -> Run)
-- ============================================================
-- AUTH: Uses Supabase Auth (Google OAuth) — NOT Firebase
-- user IDs are UUIDs from auth.users


-- ============================================================
-- 1. USERS TABLE
--    Mirrors auth.users — stores credits balance
--    id is a UUID FK to auth.users so RLS auth.uid() works correctly
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  credits INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);


-- ============================================================
-- 2. ORDERS TABLE
--    Tracks Razorpay payment orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,                              -- Razorpay order id
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  amount INTEGER NOT NULL,                          -- smallest unit (cents / paise)
  currency TEXT NOT NULL DEFAULT 'USD',
  credits INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',           -- created | completed | failed | refunded
  razorpay_order_id TEXT UNIQUE NOT NULL,
  payment_id TEXT,                                  -- razorpay_payment_id (filled on completion)
  payment_status TEXT,                              -- raw Razorpay payment state
  failure_code TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id           ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status            ON orders(status);


-- ============================================================
-- 3. PAYMENTS TABLE
--    Detailed payment records linked to orders
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  razorpay_payment_id TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  status TEXT NOT NULL,
  method TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_order_id            ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);


-- ============================================================
-- 4. USER_API_KEYS TABLE
--    Stores user-provided Gemini (and future) API keys
-- ============================================================
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gemini_google',
  api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);


-- ============================================================
-- 5. TRIGGER — Auto-create users row on first Google sign-in
--    Fires whenever a new row is inserted into auth.users
--    Gives every new user 2 starter credits automatically
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, credits, created_at, updated_at)
  VALUES (NEW.id, 2, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if it exists, then recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- 6. RPC FUNCTIONS
-- ============================================================

-- add_credits: upserts user row and increments credits
CREATE OR REPLACE FUNCTION add_credits(p_user_id UUID, p_amount INTEGER)
RETURNS VOID AS $$
BEGIN
  INSERT INTO users (id, credits, created_at, updated_at)
  VALUES (p_user_id, p_amount, NOW(), NOW())
  ON CONFLICT (id)
  DO UPDATE SET
    credits    = users.credits + p_amount,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- consume_credits: deducts credits; returns TRUE on success, FALSE if insufficient
CREATE OR REPLACE FUNCTION consume_credits(p_user_id UUID, p_amount INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  SELECT credits INTO current_credits
  FROM users
  WHERE id = p_user_id;

  IF current_credits IS NULL OR current_credits < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE users
  SET credits    = credits - p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 7. ROW LEVEL SECURITY
--    Now that we use Supabase Auth, auth.uid() works correctly!
-- ============================================================

ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- ---- users policies ----
CREATE POLICY "Users can view own record"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own record"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access users"
  ON users FOR ALL
  USING (auth.role() = 'service_role');


-- ---- orders policies ----
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access orders"
  ON orders FOR ALL
  USING (auth.role() = 'service_role');


-- ---- payments policies ----
CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  USING (
    order_id IN (
      SELECT id FROM orders WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Service role full access payments"
  ON payments FOR ALL
  USING (auth.role() = 'service_role');


-- ---- user_api_keys policies ----
CREATE POLICY "Users can view own api keys"
  ON user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys"
  ON user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys"
  ON user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys"
  ON user_api_keys FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access api keys"
  ON user_api_keys FOR ALL
  USING (auth.role() = 'service_role');


-- ============================================================
-- 8. VERIFY — lists all created tables
-- ============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('users', 'orders', 'payments', 'user_api_keys')
ORDER BY table_name;
