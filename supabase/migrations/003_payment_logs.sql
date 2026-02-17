CREATE TABLE IF NOT EXISTS payment_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  naming_id TEXT,
  order_id TEXT,
  result TEXT NOT NULL CHECK (result IN ('success', 'failure', 'info')),
  phase TEXT NOT NULL,
  http_status INT,
  toss_status TEXT,
  toss_code TEXT,
  message TEXT,
  details TEXT,
  raw_response JSONB,
  request_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_naming_id ON payment_logs(naming_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_order_id ON payment_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_result ON payment_logs(result);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);
