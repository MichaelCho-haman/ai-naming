import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '@/lib/http/cors';

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes: rate limiting 적용
  if (pathname.startsWith('/api/')) {
    // 결제/로그인 완료 콜백은 지연 시 환불 흐름으로 떨어지므로 rate-limit 제외
    if (pathname === '/api/iap/complete' || pathname === '/api/toss/login/user-key') {
      return withCors(req, NextResponse.next());
    }

    if (req.method === 'OPTIONS') {
      return withCors(req, NextResponse.next());
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    // 앱인토스 환경에서는 IP가 unknown으로 들어오는 경우가 있어 false-positive 방지
    if (ip === 'unknown') {
      return withCors(req, NextResponse.next());
    }
    const now = Date.now();

    const entry = rateLimit.get(ip);
    if (!entry || now - entry.lastReset > WINDOW_MS) {
      rateLimit.set(ip, { count: 1, lastReset: now });
      return NextResponse.next();
    }

    if (entry.count >= MAX_REQUESTS) {
      return withCors(req, NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      ));
    }

    entry.count++;
    return withCors(req, NextResponse.next());
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
  ],
};
