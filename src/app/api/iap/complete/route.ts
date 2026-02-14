import { NextRequest, NextResponse } from 'next/server';
import { getNaming, updatePaymentStatus } from '@/lib/supabase/queries';
import { getTossOrderStatus, isTossOrderPaid } from '@/lib/toss/iap-client';
import { jsonWithCors, preflight } from '@/lib/http/cors';

const allowMock = process.env.ALLOW_IAP_MOCK === 'true';

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

    const tossResponse = await getTossOrderStatus({ orderId, userKey });
    if (tossResponse.status < 200 || tossResponse.status >= 300) {
      return jsonWithCors(
        req,
        {
          error: '토스 주문 검증 API 호출에 실패했습니다',
          details: tossResponse.json?.message || tossResponse.json?.code || null,
        },
        { status: 502 }
      );
    }

    if (!isTossOrderPaid(tossResponse.json)) {
      return jsonWithCors(
        req,
        { error: '결제가 완료 상태가 아닙니다', orderStatus: tossResponse.json?.data ?? null },
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
