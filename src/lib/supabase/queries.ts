import { createServerClient } from './client';
import { NamingResult } from '@/types';

const db = () => createServerClient();

// Naming 생성 (결제 전)
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
  stripeSessionId: string;
  userId?: string;
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
    stripe_session_id: params.stripeSessionId,
    payment_status: 'pending',
    generation_status: 'pending',
    ...(params.userId ? { user_id: params.userId } : {}),
  });

  if (error) throw new Error(`Failed to create naming: ${error.message}`);
}

// 결제 완료 업데이트
export async function markNamingPaid(stripeSessionId: string) {
  const { data, error } = await db()
    .from('namings')
    .update({ payment_status: 'paid' })
    .eq('stripe_session_id', stripeSessionId)
    .select('id')
    .single();

  if (error) throw new Error(`Failed to mark naming paid: ${error.message}`);
  return data.id as string;
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

// Naming 상태만 조회 (폴링용)
export async function getNamingStatus(id: string) {
  const { data, error } = await db()
    .from('namings')
    .select('generation_status, payment_status')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

// 유저의 모든 작명 조회
export async function getUserNamings(userId: string) {
  const { data, error } = await db()
    .from('namings')
    .select('id, last_name, gender, keywords, naming_content, created_at')
    .eq('user_id', userId)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data;
}

// 기존 작명에 유저 연결
export async function linkNamingToUser(namingId: string, userId: string) {
  const { error } = await db()
    .from('namings')
    .update({ user_id: userId })
    .eq('id', namingId);

  if (error) throw new Error(`Failed to link naming: ${error.message}`);
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
