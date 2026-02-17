import { NextRequest } from 'next/server';
import { jsonWithCors, preflight } from '@/lib/http/cors';

const DEFAULT_TOSS_LOGIN_BASE_URL = 'https://apps-in-toss-api.toss.im';
const FALLBACK_TOSS_LOGIN_BASE_URL = 'https://api-partner.toss.im';
export const runtime = 'nodejs';

interface TossGenerateTokenSuccess {
  accessToken?: string;
  tokenType?: string;
  refreshToken?: string;
  expiresIn?: number;
  scope?: string;
}

interface TossLoginMeSuccess {
  userKey?: string | number;
  scope?: string;
  agreedTerms?: string[];
}

interface TossResultResponse<T> {
  resultType?: 'SUCCESS' | 'FAIL';
  success?: T;
  error?: {
    errorCode?: string;
    reason?: string;
  };
  errorCode?: string;
  reason?: string;
  message?: string;
}

function getLoginApiBaseUrl() {
  return (process.env.TOSS_LOGIN_API_BASE_URL || DEFAULT_TOSS_LOGIN_BASE_URL).trim().replace(/\/$/, '');
}

function getLoginApiBaseUrls() {
  const primary = getLoginApiBaseUrl();
  const list = [primary];
  if (primary !== FALLBACK_TOSS_LOGIN_BASE_URL) {
    list.push(FALLBACK_TOSS_LOGIN_BASE_URL);
  }
  return list;
}

function getFetchErrorReason(error: unknown) {
  if (!(error instanceof Error)) return 'unknown';
  const cause = (error as Error & { cause?: unknown }).cause as
    | { code?: string; errno?: string | number; message?: string }
    | undefined;
  const parts = [error.message];
  if (cause?.code) parts.push(`cause.code=${cause.code}`);
  if (cause?.errno !== undefined) parts.push(`cause.errno=${String(cause.errno)}`);
  if (cause?.message) parts.push(`cause.message=${cause.message}`);
  return parts.filter(Boolean).join(' / ');
}

function parseReferrer(value: unknown) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (normalized === 'DEFAULT' || normalized === 'SANDBOX') return normalized;
  return null;
}

async function parseJsonOrText(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as TossResultResponse<unknown>;
  } catch {
    return text;
  }
}

function resolveErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === 'string' && payload.trim()) return payload;
  if (typeof payload === 'object' && payload !== null) {
    const data = payload as TossResultResponse<unknown>;
    if (typeof data.message === 'string' && data.message.trim()) return data.message;
    if (typeof data.reason === 'string' && data.reason.trim()) return data.reason;
    if (data.error && typeof data.error.reason === 'string' && data.error.reason.trim()) return data.error.reason;
    if (typeof data.errorCode === 'string' && data.errorCode.trim()) return data.errorCode;
    if (data.error && typeof data.error.errorCode === 'string' && data.error.errorCode.trim()) return data.error.errorCode;
  }
  return fallback;
}

async function requestGenerateToken(authorizationCode: string, referrer: 'DEFAULT' | 'SANDBOX') {
  let res: Response | null = null;
  let usedBaseUrl = '';
  const networkErrors: string[] = [];

  for (const baseUrl of getLoginApiBaseUrls()) {
    try {
      res = await fetch(`${baseUrl}/api-partner/v1/apps-in-toss/user/oauth2/generate-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ authorizationCode, referrer }),
        cache: 'no-store',
      });
      usedBaseUrl = baseUrl;
      break;
    } catch (error) {
      networkErrors.push(`${baseUrl}: ${getFetchErrorReason(error)}`);
    }
  }

  if (!res) {
    return {
      ok: false as const,
      message: `토스 accessToken API 호출에 실패했습니다: ${networkErrors.join(' | ')}`,
      payload: null,
    };
  }

  const payload = (await parseJsonOrText(res)) as TossResultResponse<TossGenerateTokenSuccess> | string | null;
  if (!res.ok) {
    return {
      ok: false as const,
      message: resolveErrorMessage(payload, `토스 accessToken 발급에 실패했습니다 (${usedBaseUrl})`),
      payload,
    };
  }

  const accessToken = payload && typeof payload === 'object'
    ? payload.success?.accessToken ?? (payload as { accessToken?: string }).accessToken
    : undefined;

  if (!accessToken || typeof accessToken !== 'string') {
    return {
      ok: false as const,
      message: '토스 accessToken 응답이 올바르지 않습니다',
      payload,
    };
  }

  return {
    ok: true as const,
    accessToken,
    payload,
  };
}

async function requestLoginMe(accessToken: string) {
  let res: Response | null = null;
  let usedBaseUrl = '';
  const networkErrors: string[] = [];

  for (const baseUrl of getLoginApiBaseUrls()) {
    try {
      res = await fetch(`${baseUrl}/api-partner/v1/apps-in-toss/user/oauth2/login-me`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      usedBaseUrl = baseUrl;
      break;
    } catch (error) {
      networkErrors.push(`${baseUrl}: ${getFetchErrorReason(error)}`);
    }
  }

  if (!res) {
    return {
      ok: false as const,
      message: `토스 사용자 조회 API 호출에 실패했습니다: ${networkErrors.join(' | ')}`,
      payload: null,
    };
  }

  const payload = (await parseJsonOrText(res)) as TossResultResponse<TossLoginMeSuccess> | string | null;
  if (!res.ok) {
    return {
      ok: false as const,
      message: resolveErrorMessage(payload, `토스 사용자 조회에 실패했습니다 (${usedBaseUrl})`),
      payload,
    };
  }

  const userKey = payload && typeof payload === 'object'
    ? payload.success?.userKey ?? (payload as { userKey?: string | number }).userKey
    : undefined;

  if (typeof userKey !== 'string' && typeof userKey !== 'number') {
    return {
      ok: false as const,
      message: '토스 사용자 응답에 userKey가 없습니다',
      payload,
    };
  }

  return {
    ok: true as const,
    userKey: String(userKey),
    payload,
  };
}

export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authorizationCode =
      typeof body?.authorizationCode === 'string' ? body.authorizationCode.trim() : '';
    const referrer = parseReferrer(body?.referrer);

    if (!authorizationCode) {
      return jsonWithCors(req, { error: 'authorizationCode가 필요합니다' }, { status: 400 });
    }
    if (!referrer) {
      return jsonWithCors(req, { error: 'referrer가 올바르지 않습니다' }, { status: 400 });
    }

    const tokenResult = await requestGenerateToken(authorizationCode, referrer);
    if (!tokenResult.ok) {
      return jsonWithCors(
        req,
        {
          error: tokenResult.message,
          details: tokenResult.payload ?? null,
        },
        { status: 502 }
      );
    }

    const loginMeResult = await requestLoginMe(tokenResult.accessToken);
    if (!loginMeResult.ok) {
      return jsonWithCors(
        req,
        {
          error: loginMeResult.message,
          details: loginMeResult.payload ?? null,
        },
        { status: 502 }
      );
    }

    return jsonWithCors(req, {
      ok: true,
      userKey: loginMeResult.userKey,
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown';
    console.error('Toss login userKey error:', error);
    return jsonWithCors(
      req,
      {
        error: `토스 로그인 처리에 실패했습니다: ${reason}`,
      },
      { status: 500 }
    );
  }
}
