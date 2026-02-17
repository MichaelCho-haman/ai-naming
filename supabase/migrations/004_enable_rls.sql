-- Lock down public tables by enabling row-level security.
-- API server uses SUPABASE_SERVICE_ROLE_KEY, so server-side writes continue to work.
ALTER TABLE public.namings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
