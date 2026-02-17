import { createServerClient } from './client';
import { NamingResult } from '@/types';

const db = () => createServerClient();

type PaymentLogResult = 'success' | 'failure' | 'info';

// Naming 생성
export async function createNaming(params: {
  id: string;
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
  paymentStatus?: 'pending' | 'free';
}) {
  const { error } = await db().from('namings').insert({
    id: params.id,
    last_name: params.lastName,
    gender: params.gender,
    birth_year: params.birthYear,
    birth_month: params.birthMonth,
    birth_day: params.birthDay,
    birth_hour: params.birthHour,
    birth_minute: params.birthMinute,
    keywords: params.keywords,
    payment_status: params.paymentStatus ?? 'pending',
    generation_status: 'pending',
    amount_cents: 550,
  });

  if (error) throw new Error(`Failed to create naming: ${error.message}`);
}

// GPT 생성 상태 업데이트
export async function updateGenerationStatus(
  id: string,
  status: 'generating' | 'completed' | 'failed'
) {
  const { error } = await db()
    .from('namings')
    .update({ generation_status: status })
    .eq('id', id);

  if (error) throw new Error(`Failed to update generation status: ${error.message}`);
}

// GPT 결과 저장
export async function saveNamingResult(
  id: string,
  content: NamingResult,
  raw: string
) {
  const { error } = await db()
    .from('namings')
    .update({
      naming_content: content,
      naming_raw: raw,
      generation_status: 'completed',
    })
    .eq('id', id);

  if (error) throw new Error(`Failed to save naming result: ${error.message}`);
}

// 결제 상태 업데이트
export async function updatePaymentStatus(
  id: string,
  status: 'pending' | 'free' | 'paid' | 'failed',
  options?: {
    orderId?: string | null;
    paidAt?: string | null;
  }
) {
  const updatePayload: Record<string, unknown> = { payment_status: status };
  if (options && Object.prototype.hasOwnProperty.call(options, 'orderId')) {
    updatePayload.order_id = options.orderId ?? null;
  }
  if (options && Object.prototype.hasOwnProperty.call(options, 'paidAt')) {
    updatePayload.paid_at = options.paidAt ?? null;
  }

  const { error } = await db()
    .from('namings')
    .update(updatePayload)
    .eq('id', id);

  if (error) throw new Error(`Failed to update payment status: ${error.message}`);
}

// Naming 조회
export async function getNaming(id: string) {
  const { data, error } = await db()
    .from('namings')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

// 조회수 증가
export async function incrementViewCount(id: string) {
  const naming = await getNaming(id);
  if (naming) {
    await db()
      .from('namings')
      .update({ view_count: (naming.view_count || 0) + 1 })
      .eq('id', id);
  }
}

export async function insertPaymentLog(params: {
  namingId?: string | null;
  orderId?: string | null;
  result: PaymentLogResult;
  phase: string;
  httpStatus?: number | null;
  tossStatus?: string | null;
  tossCode?: string | null;
  message?: string | null;
  details?: string | null;
  rawResponse?: unknown;
  requestId?: string | null;
}) {
  const payload = {
    naming_id: params.namingId ?? null,
    order_id: params.orderId ?? null,
    result: params.result,
    phase: params.phase,
    http_status: params.httpStatus ?? null,
    toss_status: params.tossStatus ?? null,
    toss_code: params.tossCode ?? null,
    message: params.message ?? null,
    details: params.details ?? null,
    raw_response: params.rawResponse ?? null,
    request_id: params.requestId ?? null,
  };

  const { error } = await db().from('payment_logs').insert(payload);
  if (error) {
    console.error('Failed to insert payment log:', error.message);
  }
}
