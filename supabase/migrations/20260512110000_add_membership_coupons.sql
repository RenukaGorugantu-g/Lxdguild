CREATE TABLE IF NOT EXISTS membership_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('flat', 'percent')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE,
  max_redemptions INTEGER,
  per_user_redemption_limit INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS membership_coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES membership_coupons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  membership_payment_id UUID REFERENCES membership_payments(id) ON DELETE SET NULL,
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  original_amount_inr INTEGER NOT NULL,
  discount_amount_inr INTEGER NOT NULL,
  final_amount_inr INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS membership_coupon_redemptions_coupon_id_idx
ON membership_coupon_redemptions (coupon_id, redeemed_at DESC);

CREATE INDEX IF NOT EXISTS membership_coupon_redemptions_user_id_idx
ON membership_coupon_redemptions (user_id, redeemed_at DESC);

ALTER TABLE membership_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_coupon_redemptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage membership coupons" ON membership_coupons;
CREATE POLICY "Admins manage membership coupons" ON membership_coupons
FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Users can view their coupon redemptions" ON membership_coupon_redemptions;
CREATE POLICY "Users can view their coupon redemptions" ON membership_coupon_redemptions
FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE membership_payments
ADD COLUMN IF NOT EXISTS original_amount_inr INTEGER,
ADD COLUMN IF NOT EXISTS discount_amount_inr INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS coupon_code TEXT;

UPDATE membership_payments
SET original_amount_inr = COALESCE(original_amount_inr, amount_inr)
WHERE original_amount_inr IS NULL;
