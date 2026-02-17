import { NextRequest, NextResponse } from 'next/server';

const DEFAULT_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'x-toss-user-key',
];

const DEFAULT_ALLOWED_METHODS = ['GET', 'POST', 'OPTIONS'];

function parseAllowedOrigins() {
  const raw = process.env.CORS_ALLOWED_ORIGINS || '';
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function isSubdomainOrSame(host: string, baseDomain: string) {
  return host === baseDomain || host.endsWith(`.${baseDomain}`);
}

function parseOrigin(origin: string) {
  try {
    return new URL(origin);
  } catch {
    return null;
  }
}

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (parseAllowedOrigins().includes(origin)) return true;

  const parsed = parseOrigin(origin);
  if (!parsed) return false;

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();

  if (protocol === 'http:' && (hostname === 'localhost' || hostname === '127.0.0.1')) {
    return true;
  }

  if (protocol !== 'https:') return false;

  if (isSubdomainOrSame(hostname, 'toss.im')) return true;
  if (isSubdomainOrSame(hostname, 'tossmini.com')) return true;
  return false;
}

function resolveAllowOrigin(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!origin) return '*';
  if (isAllowedOrigin(origin)) return origin;
  return 'null';
}

export function withCors(req: NextRequest, res: NextResponse) {
  const allowOrigin = resolveAllowOrigin(req);
  res.headers.set('Access-Control-Allow-Origin', allowOrigin);
  res.headers.set('Vary', 'Origin');
  res.headers.set('Access-Control-Allow-Methods', DEFAULT_ALLOWED_METHODS.join(', '));
  res.headers.set('Access-Control-Allow-Headers', DEFAULT_ALLOWED_HEADERS.join(', '));
  res.headers.set('Access-Control-Max-Age', '86400');
  return res;
}

export function preflight(req: NextRequest) {
  return withCors(req, new NextResponse(null, { status: 204 }));
}

export function jsonWithCors(
  req: NextRequest,
  body: unknown,
  init?: ResponseInit
) {
  return withCors(req, NextResponse.json(body, init));
}
