import { NextRequest, NextResponse } from 'next/server';
import { withCors } from '@/lib/http/cors';

// Simple in-memory rate limiting
const rateLimit = new Map<string, { count: number; lastReset: number }>();
const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

function getRateLimitKey(req: NextRequest) {
  const forwardedIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const realIp = req.headers.get('x-real-ip')?.trim();
  const cfIp = req.headers.get('cf-connecting-ip')?.trim();
  const ipCandidate = forwardedIp || realIp || cfIp;

  if (ipCandidate && ipCandidate !== 'unknown') {
    return `ip:${ipCandidate}`;
  }

  // IP를 확보하지 못하는 환경(일부 앱인토스 요청)에서도 최소한의 남용 방어가 가능하도록
  // 헤더 기반 fingerprint로 제한합니다.
  const userAgent = req.headers.get('user-agent') || 'unknown-ua';
  const origin = req.headers.get('origin') || 'unknown-origin';
  const language = req.headers.get('accept-language') || 'unknown-lang';
  const tossUserKey = req.headers.get('x-toss-user-key') || 'no-user-key';

  return `fp:${userAgent}|${origin}|${language}|${tossUserKey}`;
}

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

    const rateKey = getRateLimitKey(req);
    const now = Date.now();

    const entry = rateLimit.get(rateKey);
    if (!entry || now - entry.lastReset > WINDOW_MS) {
      rateLimit.set(rateKey, { count: 1, lastReset: now });
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
