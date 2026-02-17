import { NextRequest, NextResponse } from 'next/server';
import { getNaming, updatePaymentStatus } from '@/lib/supabase/queries';
import { getTossOrderStatus, isTossOrderPaid } from '@/lib/toss/iap-client';
import { jsonWithCors, preflight } from '@/lib/http/cors';

const allowMock = process.env.ALLOW_IAP_MOCK === 'true';
const verifyRetries = Number(process.env.TOSS_IAP_VERIFY_RETRIES || '20');
const verifyRetryDelayMs = Number(process.env.TOSS_IAP_VERIFY_RETRY_DELAY_MS || '1200');

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  try {
    const body = await req.json();
    const { namingId, orderId, userKey: bodyUserKey } = body ?? {};
    const userKey = bodyUserKey || req.headers.get('x-toss-user-key');

    if (!namingId || typeof namingId !== 'string') {
      return jsonWithCors(req, { error: 'namingId가 필요합니다' }, { status: 400 });
    }

    const naming = await getNaming(namingId);
    if (!naming) {
      return jsonWithCors(req, { error: '작명 결과를 찾을 수 없습니다' }, { status: 404 });
    }

    if (naming.payment_status === 'paid') {
      return jsonWithCors(req, { ok: true, paymentStatus: 'paid' });
    }

    if (allowMock && !orderId) {
      await updatePaymentStatus(namingId, 'paid');
      return jsonWithCors(req, { ok: true, paymentStatus: 'paid', mocked: true });
    }

    if (!orderId || typeof orderId !== 'string') {
      return jsonWithCors(
        req,
        { error: 'orderId가 필요합니다' },
        { status: 400 }
      );
    }

    if (!userKey) {
      return jsonWithCors(
        req,
        { error: 'userKey가 필요합니다. 토스 로그인 연동 후 전달해주세요' },
        { status: 400 }
      );
    }

    const verification = await verifyPaidOrderWithRetry(orderId, userKey);

    if (!verification.ok && verification.response && (verification.response.status < 200 || verification.response.status >= 300)) {
      return jsonWithCors(
        req,
        {
          error: '토스 주문 검증 API 호출에 실패했습니다',
          details:
            verification.response.json?.message ||
            verification.response.json?.code ||
            null,
        },
        { status: 502 }
      );
    }

    if (!verification.ok) {
      const fallbackErrorMessage =
        verification.error instanceof Error ? verification.error.message : null;
      const responseJson = verification.response?.json ?? null;
      const responseSuccess =
        responseJson && typeof responseJson === 'object' && 'success' in responseJson
          ? (responseJson as { success?: unknown }).success
          : null;
      const responseData =
        responseJson && typeof responseJson === 'object' && 'data' in responseJson
          ? (responseJson as { data?: unknown }).data
          : null;
      return jsonWithCors(
        req,
        {
          error: '결제가 완료 상태가 아닙니다',
          orderStatus: responseSuccess ?? responseData,
          rawOrderStatus: responseJson,
          details: fallbackErrorMessage,
        },
        { status: 409 }
      );
    }

    await updatePaymentStatus(namingId, 'paid');

    return jsonWithCors(req, {
      ok: true,
      paymentStatus: 'paid',
      orderId,
    });
  } catch (error) {
    console.error('IAP complete error:', error);
    return jsonWithCors(
      req,
      { error: '결제 완료 처리에 실패했습니다' },
      { status: 500 }
    );
  }
}
