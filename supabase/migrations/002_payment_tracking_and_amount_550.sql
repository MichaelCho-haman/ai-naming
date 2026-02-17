ALTER TABLE namings
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE namings
  ALTER COLUMN amount_cents SET DEFAULT 550;

UPDATE namings
SET amount_cents = 550
WHERE amount_cents = 990;

CREATE INDEX IF NOT EXISTS idx_namings_order_id ON namings(order_id);
CREATE INDEX IF NOT EXISTS idx_namings_paid_at ON namings(paid_at DESC);
