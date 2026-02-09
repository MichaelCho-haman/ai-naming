import { createBrowserClient as createSSRBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

// 브라우저용 클라이언트 (anon key + 쿠키 기반 세션)
export function createBrowserClient() {
  return createSSRBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// 서버용 클라이언트 (service role key — API routes/webhook용, auth 우회)
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export const createServerClient = createServiceClient;
