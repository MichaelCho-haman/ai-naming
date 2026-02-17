import { NextRequest } from 'next/server';
import { getNaming, insertPaymentLog, updatePaymentStatus } from '@/lib/supabase/queries';
import { getTossOrderStatus, isTossOrderPaid } from '@/lib/toss/iap-client';
import { jsonWithCors, preflight } from '@/lib/http/cors';

export const runtime = 'nodejs';

const allowMock = process.env.ALLOW_IAP_MOCK === 'true';
const verifyRetries = Number(process.env.TOSS_IAP_VERIFY_RETRIES || '6');
const verifyRetryDelayMs = Number(process.env.TOSS_IAP_VERIFY_RETRY_DELAY_MS || '350');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickStatusHint(raw: unknown) {
  if (!raw || typeof raw !== 'object') return null;
  const targetKeys = ['status', 'orderStatus', 'purchaseStatus', 'paymentStatus', 'state', 'purchaseState'];
  const codeKeys = ['code', 'resultType', 'result_code'];
  let status: unknown = null;
  let code: unknown = null;
  let message: unknown = null;

  const visited = new WeakSet<object>();
  const walk = (value: unknown, depth = 0) => {
    if (depth > 6) return;
    if (value === null || value === undefined) return;
    if (typeof value !== 'object') return;
    const obj = value as object;
    if (visited.has(obj)) return;
    visited.add(obj);

    if (Array.isArray(value)) {
      for (const item of value) walk(item, depth + 1);
      return;
    }

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const lowered = key.toLowerCase();
      if (status === null && targetKeys.some((k) => k.toLowerCase() === lowered) && child !== null && child !== undefined) {
        status = child;
      }
      if (code === null && codeKeys.some((k) => k.toLowerCase() === lowered) && child !== null && child !== undefined) {
        code = child;
      }
      if (message === null && lowered === 'message' && child !== null && child !== undefined) {
        message = child;
      }
      walk(child, depth + 1);
    }
  };

  walk(raw);
  return {
    status: status ?? null,
    code: code ?? null,
    message: message ?? null,
  };
}

function toNullableString(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  return fallback;
}

function getRequestId(req: NextRequest) {
  return req.headers.get('x-request-id') || req.headers.get('x-vercel-id');
}

async function verifyPaidOrderWithRetry(orderId: string, userKey: string) {
  let lastResponse: Awaited<ReturnType<typeof getTossOrderStatus>> | null = null;
  let lastError: unknown = null;

  for (let attempt = 0; attempt < Math.max(1, verifyRetries); attempt++) {
    try {
      const response = await getTossOrderStatus({ orderId, userKey });
      lastResponse = response;
      lastError = null;

      if (response.status >= 200 && response.status < 300 && isTossOrderPaid(response.json)) {
        return { ok: true as const, response };
      }
    } catch (error) {
      lastError = error;
    }

    if (attempt < Math.max(1, verifyRetries) - 1) {
      await sleep(Math.max(0, verifyRetryDelayMs));
    }
  }

  return {
    ok: false as const,
    response: lastResponse,
    error: lastError,
  };
}

export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  const requestId = getRequestId(req);
  let namingIdForLog: string | null = null;
  let orderIdForLog: string | null = null;

  try {
    const body = await req.json();
    const { namingId, orderId, userKey: bodyUserKey } = body ?? {};
    namingIdForLog = typeof namingId === 'string' ? namingId : null;
    orderIdForLog = typeof orderId === 'string' ? orderId : null;
    const userKey = bodyUserKey || req.headers.get('x-toss-user-key');

    if (!namingId || typeof namingId !== 'string') {
      await insertPaymentLog({
        namingId: namingIdForLog,
        orderId: orderIdForLog,
        result: 'failure',
        phase: 'validation_failed',
        httpStatus: 400,
        message: 'namingId가 필요합니다',
        requestId,
      });
      return jsonWithCors(req, { error: 'namingId가 필요합니다' }, { status: 400 });
    }

    const naming = await getNaming(namingId);
    if (!naming) {
      await insertPaymentLog({
        namingId: namingIdForLog,
        orderId: orderIdForLog,
        result: 'failure',
        phase: 'naming_not_found',
        httpStatus: 404,
        message: '작명 결과를 찾을 수 없습니다',
        requestId,
      });
      return jsonWithCors(req, { error: '작명 결과를 찾을 수 없습니다' }, { status: 404 });
    }

    if (naming.payment_status === 'paid') {
      await insertPaymentLog({
        namingId,
        orderId: orderIdForLog ?? naming.order_id ?? null,
        result: 'info',
        phase: 'already_paid',
        httpStatus: 200,
        tossStatus: 'ALREADY_PAID',
        message: '이미 결제 완료된 namingId',
        requestId,
      });
      return jsonWithCors(req, {
        ok: true,
        paymentStatus: 'paid',
        orderId: naming.order_id ?? undefined,
        paidAt: naming.paid_at ?? undefined,
      });
    }

    if (allowMock && !orderId) {
      const paidAt = new Date().toISOString();
      await updatePaymentStatus(namingId, 'paid', {
        orderId: null,
        paidAt,
      });
      await insertPaymentLog({
        namingId,
        orderId: null,
        result: 'success',
        phase: 'mock_paid',
        httpStatus: 200,
        tossStatus: 'MOCK_PAID',
        message: '모의 결제 완료 처리',
        details: 'ALLOW_IAP_MOCK=true',
        requestId,
      });
      return jsonWithCors(req, {
        ok: true,
        paymentStatus: 'paid',
        mocked: true,
        paidAt,
      });
    }

    if (!orderId || typeof orderId !== 'string') {
      await insertPaymentLog({
        namingId,
        orderId: orderIdForLog,
        result: 'failure',
        phase: 'validation_failed',
        httpStatus: 400,
        message: 'orderId가 필요합니다',
        requestId,
      });
      return jsonWithCors(
        req,
        { error: 'orderId가 필요합니다' },
        { status: 400 }
      );
    }

    if (!userKey) {
      await insertPaymentLog({
        namingId,
        orderId,
        result: 'failure',
        phase: 'validation_failed',
        httpStatus: 400,
        message: 'userKey가 필요합니다',
        requestId,
      });
      return jsonWithCors(
        req,
        { error: 'userKey가 필요합니다. 토스 로그인 연동 후 전달해주세요' },
        { status: 400 }
      );
    }

    const verification = await verifyPaidOrderWithRetry(orderId, userKey);

    if (!verification.ok && verification.response && (verification.response.status < 200 || verification.response.status >= 300)) {
      const hint = pickStatusHint(verification.response.json);
      const detailsValue =
        verification.response.json?.message ||
        verification.response.json?.code ||
        null;
      const errorMessage = `토스 주문 검증 API 호출에 실패했습니다 (http:${verification.response.status}, status:${String(hint?.status ?? '-')} code:${String(hint?.code ?? '-')})`;
      await insertPaymentLog({
        namingId,
        orderId,
        result: 'failure',
        phase: 'verify_api_failed',
        httpStatus: verification.response.status,
        tossStatus: toNullableString(hint?.status),
        tossCode: toNullableString(hint?.code),
        message: errorMessage,
        details: toNullableString(detailsValue),
        rawResponse: verification.response.json,
        requestId,
      });
      console.error('IAP verify API failed', {
        namingId,
        orderId,
        httpStatus: verification.response.status,
        hint,
      });
      return jsonWithCors(
        req,
        {
          error: errorMessage,
          details: detailsValue,
        },
        { status: 502 }
      );
    }

    if (!verification.ok) {
      const fallbackErrorMessage =
        verification.error instanceof Error ? verification.error.message : null;
      const responseJson = verification.response?.json ?? null;
      const hint = pickStatusHint(responseJson);
      const responseSuccess =
        responseJson && typeof responseJson === 'object' && 'success' in responseJson
          ? (responseJson as { success?: unknown }).success
          : null;
      const responseData =
        responseJson && typeof responseJson === 'object' && 'data' in responseJson
          ? (responseJson as { data?: unknown }).data
          : null;
      console.error('IAP verify not paid', {
        namingId,
        orderId,
        hint,
        responseJson,
        fallbackErrorMessage,
      });
      const errorMessage = `결제가 완료 상태가 아닙니다 (status:${String(hint?.status ?? '-')} code:${String(hint?.code ?? '-')})`;
      await insertPaymentLog({
        namingId,
        orderId,
        result: 'failure',
        phase: 'verify_not_paid',
        httpStatus: 409,
        tossStatus: toNullableString(hint?.status),
        tossCode: toNullableString(hint?.code),
        message: errorMessage,
        details: toNullableString(fallbackErrorMessage),
        rawResponse: responseJson,
        requestId,
      });
      return jsonWithCors(
        req,
        {
          error: errorMessage,
          orderStatus: responseSuccess ?? responseData,
          rawOrderStatus: responseJson,
          details: fallbackErrorMessage,
        },
        { status: 409 }
      );
    }

    const paidAt = new Date().toISOString();
    await updatePaymentStatus(namingId, 'paid', {
      orderId,
      paidAt,
    });
    await insertPaymentLog({
      namingId,
      orderId,
      result: 'success',
      phase: 'verify_paid',
      httpStatus: 200,
      tossStatus: 'PAID',
      message: '결제 검증 완료',
      rawResponse: verification.response?.json ?? null,
      requestId,
    });

    return jsonWithCors(req, {
      ok: true,
      paymentStatus: 'paid',
      orderId,
      paidAt,
    });
  } catch (error) {
    await insertPaymentLog({
      namingId: namingIdForLog,
      orderId: orderIdForLog,
      result: 'failure',
      phase: 'exception',
      httpStatus: 500,
      message: getErrorMessage(error, '결제 완료 처리에 실패했습니다'),
      requestId,
    });
    console.error('IAP complete error:', error);
    return jsonWithCors(
      req,
      { error: '결제 완료 처리에 실패했습니다' },
      { status: 500 }
    );
  }
}
