import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes: rate limiting 적용
  if (pathname.startsWith('/api/')) {
    // Skip webhook (Stripe needs reliable access)
    if (pathname === '/api/webhook') {
      return NextResponse.next();
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();

    const entry = rateLimit.get(ip);
    if (!entry || now - entry.lastReset > WINDOW_MS) {
      rateLimit.set(ip, { count: 1, lastReset: now });
      return NextResponse.next();
    }

    if (entry.count >= MAX_REQUESTS) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      );
    }

    entry.count++;
    return NextResponse.next();
  }

  // Auth callback — 그대로 통과
  if (pathname.startsWith('/auth/')) {
    return NextResponse.next();
  }

  // 세션 갱신
  return await updateSession(req);
}

export const config = {
  matcher: [
    '/api/:path*',
    '/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
