ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS membership_plan TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS membership_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS membership_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS membership_payment_id TEXT,
ADD COLUMN IF NOT EXISTS membership_order_id TEXT;

UPDATE profiles
SET membership_plan = COALESCE(membership_plan, membership_status, 'free')
WHERE membership_plan IS NULL;

CREATE TABLE IF NOT EXISTS membership_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_inr INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  plan_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  membership_started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  membership_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS membership_payments_user_id_idx
ON membership_payments (user_id, paid_at DESC);

ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their membership payments" ON membership_payments;
CREATE POLICY "Users can view their membership payments" ON membership_payments
FOR SELECT USING (auth.uid() = user_id);

CREATE UNIQUE INDEX IF NOT EXISTS resources_file_link_unique_idx
ON resources (file_link);

DROP POLICY IF EXISTS "Pro members viewing" ON resources;
DROP POLICY IF EXISTS "Authenticated users can view resource catalog" ON resources;
CREATE POLICY "Authenticated users can view resource catalog" ON resources
FOR SELECT USING (auth.uid() IS NOT NULL);
