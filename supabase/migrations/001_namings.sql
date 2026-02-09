CREATE TABLE namings (
  id TEXT PRIMARY KEY,
  last_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  birth_year INT,
  birth_month INT,
  birth_day INT,
  birth_hour INT,
  birth_minute INT,
  keywords TEXT,
  naming_content JSONB,
  naming_raw TEXT,
  stripe_session_id TEXT UNIQUE,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  generation_status TEXT NOT NULL DEFAULT 'pending',
  amount_cents INT NOT NULL DEFAULT 990,
  user_id UUID REFERENCES auth.users(id),
  view_count INT DEFAULT 0,
  shared_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_namings_stripe_session ON namings(stripe_session_id);
CREATE INDEX idx_namings_payment_status ON namings(payment_status);
CREATE INDEX idx_namings_user_id ON namings(user_id);
CREATE INDEX idx_namings_created_at ON namings(created_at DESC);
