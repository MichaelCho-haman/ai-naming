import { createServerClient } from './client';
import { NamingResult } from '@/types';

const db = () => createServerClient();

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
    payment_status: 'free',
    generation_status: 'pending',
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
