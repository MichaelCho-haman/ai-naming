import { NextRequest } from 'next/server';
import {
  findPaidNamingIdByOrderId,
  getLatestOrderIdByNamingId,
  getNaming,
  insertPaymentLog,
  updatePaymentStatus,
} from '@/lib/supabase/queries';
import { getTossOrderStatus, isTossOrderPaid } from '@/lib/toss/iap-client';
import { jsonWithCors, preflight } from '@/lib/http/cors';

export const runtime = 'nodejs';

const allowMock = process.env.NODE_ENV !== 'production' && process.env.ALLOW_IAP_MOCK === 'true';
const verifyRetries = Number(process.env.TOSS_IAP_VERIFY_RETRIES || '6');
const verifyRetryDelayMs = Number(process.env.TOSS_IAP_VERIFY_RETRY_DELAY_MS || '350');
const expectedProductId = (
  process.env.TOSS_IAP_PRODUCT_ID ||
  process.env.NEXT_PUBLIC_TOSS_IAP_PRODUCT_ID ||
  ''
).trim();
const expectedAmount = Number(process.env.TOSS_IAP_EXPECTED_AMOUNT || '550');
const hasExpectedAmount = Number.isFinite(expectedAmount) && expectedAmount > 0;

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

function findFirstDeepValue(raw: unknown, targetKeys: string[]) {
  if (!raw || typeof raw !== 'object') return null;
  const keySet = new Set(targetKeys.map((key) => key.toLowerCase()));
  let found: unknown = undefined;
  const visited = new WeakSet<object>();

  const walk = (value: unknown, depth = 0) => {
    if (found !== undefined || depth > 6) return;
    if (value === null || value === undefined) return;
    if (typeof value !== 'object') return;
    const obj = value as object;
    if (visited.has(obj)) return;
    visited.add(obj);

    if (Array.isArray(value)) {
      for (const item of value) {
        walk(item, depth + 1);
      }
      return;
    }

    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      if (found === undefined && keySet.has(key.toLowerCase()) && child !== null && child !== undefined) {
        found = child;
        return;
      }
      walk(child, depth + 1);
      if (found !== undefined) return;
    }
  };

  walk(raw);
  return found === undefined ? null : found;
}

function toNullableAmount(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.round(value);
  }
  if (typeof value !== 'string') return null;
  const normalized = value.replace(/,/g, '').trim();
  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) {
    return Math.round(numeric);
  }
  const matched = normalized.match(/-?\d+(\.\d+)?/);
  if (!matched) return null;
  const parsed = Number(matched[0]);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function extractVerificationFields(raw: unknown) {
  const rawOrderId = findFirstDeepValue(raw, ['orderId', 'order_id']);
  const rawProductId = findFirstDeepValue(raw, ['sku', 'productId', 'product_id', 'itemId', 'item_id']);
  const rawAmount = findFirstDeepValue(raw, ['amount', 'paymentAmount', 'paidAmount', 'price', 'totalAmount', 'displayAmount']);

  const orderId = toNullableString(rawOrderId)?.trim() || null;
  const productId = toNullableString(rawProductId)?.trim() || null;
  const amount = toNullableAmount(rawAmount);

  return { orderId, productId, amount };
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
    orderIdForLog = typeof orderId === 'string' ? orderId.trim() : null;
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

    let effectiveOrderId =
      typeof orderId === 'string' && orderId.trim()
        ? orderId.trim()
        : (typeof naming.order_id === 'string' && naming.order_id.trim() ? naming.order_id.trim() : null);

    if (!effectiveOrderId) {
      const recoveredOrderId = await getLatestOrderIdByNamingId(namingId);
      if (recoveredOrderId) {
        effectiveOrderId = recoveredOrderId;
      }
    }

    if (effectiveOrderId && orderIdForLog !== effectiveOrderId) {
      orderIdForLog = effectiveOrderId;
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
        result: 'info',
        phase: 'order_id_recovered',
        httpStatus: 200,
        message: '요청에 orderId가 없어 기존 결제 이력에서 복구',
        requestId,
      });
    }

    if (!effectiveOrderId) {
      await insertPaymentLog({
        namingId,
        orderId: orderIdForLog ?? null,
        result: 'failure',
        phase: 'order_id_missing',
        httpStatus: 400,
        message: 'orderId를 찾을 수 없습니다',
        requestId,
      });
      return jsonWithCors(
        req,
        { error: 'orderId를 찾을 수 없습니다. 같은 결과 화면에서 다시 시도해주세요.' },
        { status: 400 }
      );
    }

    if (!userKey) {
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
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

    const paidNamingIdByOrderId = await findPaidNamingIdByOrderId(effectiveOrderId);
    if (paidNamingIdByOrderId && paidNamingIdByOrderId !== namingId) {
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
        result: 'failure',
        phase: 'order_id_reused',
        httpStatus: 409,
        message: `이미 다른 결과에서 결제 완료된 orderId입니다 (owner:${paidNamingIdByOrderId})`,
        requestId,
      });
      return jsonWithCors(
        req,
        { error: '이미 사용된 결제 주문번호입니다. 새로운 결제로 다시 시도해주세요.' },
        { status: 409 }
      );
    }

    const verification = await verifyPaidOrderWithRetry(effectiveOrderId, userKey);

    if (!verification.ok && !verification.response) {
      const fallbackErrorMessage =
        verification.error instanceof Error ? verification.error.message : null;
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
        result: 'failure',
        phase: 'verify_network_error',
        httpStatus: 502,
        message: '토스 주문 검증 네트워크 오류',
        details: toNullableString(fallbackErrorMessage),
        requestId,
      });
      return jsonWithCors(
        req,
        {
          error: '토스 주문 검증 네트워크 오류가 발생했습니다',
          details: fallbackErrorMessage,
        },
        { status: 502 }
      );
    }

    if (!verification.ok && verification.response && (verification.response.status < 200 || verification.response.status >= 300)) {
      const hint = pickStatusHint(verification.response.json);
      const detailsValue =
        verification.response.json?.message ||
        verification.response.json?.code ||
        null;
      const errorMessage = `토스 주문 검증 API 호출에 실패했습니다 (http:${verification.response.status}, status:${String(hint?.status ?? '-')} code:${String(hint?.code ?? '-')})`;
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
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
        orderId: effectiveOrderId,
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
        orderId: effectiveOrderId,
        hint,
        responseJson,
        fallbackErrorMessage,
      });
      const errorMessage = `결제가 완료 상태가 아닙니다 (status:${String(hint?.status ?? '-')} code:${String(hint?.code ?? '-')})`;
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
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

    const verificationFields = extractVerificationFields(verification.response?.json ?? null);

    if (verificationFields.orderId && verificationFields.orderId !== effectiveOrderId) {
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
        result: 'failure',
        phase: 'verify_order_mismatch',
        httpStatus: 409,
        tossStatus: 'ORDER_MISMATCH',
        message: `토스 응답 orderId 불일치 (expected:${effectiveOrderId}, actual:${verificationFields.orderId})`,
        rawResponse: verification.response?.json ?? null,
        requestId,
      });
      return jsonWithCors(
        req,
        { error: '결제 주문번호 검증에 실패했습니다. 다시 시도해주세요.' },
        { status: 409 }
      );
    }

    if (expectedProductId && verificationFields.productId && verificationFields.productId !== expectedProductId) {
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
        result: 'failure',
        phase: 'verify_product_mismatch',
        httpStatus: 409,
        tossStatus: 'PRODUCT_MISMATCH',
        message: `토스 응답 상품 불일치 (expected:${expectedProductId}, actual:${verificationFields.productId})`,
        rawResponse: verification.response?.json ?? null,
        requestId,
      });
      return jsonWithCors(
        req,
        { error: '결제 상품 검증에 실패했습니다. 다시 시도해주세요.' },
        { status: 409 }
      );
    }

    if (hasExpectedAmount && verificationFields.amount !== null && verificationFields.amount !== expectedAmount) {
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
        result: 'failure',
        phase: 'verify_amount_mismatch',
        httpStatus: 409,
        tossStatus: 'AMOUNT_MISMATCH',
        message: `토스 응답 금액 불일치 (expected:${expectedAmount}, actual:${verificationFields.amount})`,
        rawResponse: verification.response?.json ?? null,
        requestId,
      });
      return jsonWithCors(
        req,
        { error: '결제 금액 검증에 실패했습니다. 다시 시도해주세요.' },
        { status: 409 }
      );
    }

    if ((expectedProductId && !verificationFields.productId) || (hasExpectedAmount && verificationFields.amount === null)) {
      await insertPaymentLog({
        namingId,
        orderId: effectiveOrderId,
        result: 'info',
        phase: 'verify_fields_partial',
        httpStatus: 200,
        message: '토스 응답에서 일부 검증 필드를 확인하지 못했습니다',
        details: JSON.stringify({
          expectedProductId: expectedProductId || null,
          actualProductId: verificationFields.productId,
          expectedAmount: hasExpectedAmount ? expectedAmount : null,
          actualAmount: verificationFields.amount,
        }),
        rawResponse: verification.response?.json ?? null,
        requestId,
      });
    }

    const paidAt = new Date().toISOString();
    await updatePaymentStatus(namingId, 'paid', {
      orderId: effectiveOrderId,
      paidAt,
    });
    await insertPaymentLog({
      namingId,
      orderId: effectiveOrderId,
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
      orderId: effectiveOrderId,
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
