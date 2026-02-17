import { NextRequest, NextResponse, after } from 'next/server';
import { createNaming, updateGenerationStatus, saveNamingResult } from '@/lib/supabase/queries';
import { generateNamingId } from '@/lib/utils/id-generator';
import { validateNamingInput } from '@/lib/utils/validation';
import { generateNaming } from '@/lib/gpt/naming-generator';
import { jsonWithCors, preflight } from '@/lib/http/cors';

export const maxDuration = 60;
const appTarget = process.env.NEXT_PUBLIC_APP_TARGET ?? 'web';
const defaultPaymentStatus = appTarget === 'toss' ? 'pending' : 'free';

export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lastName, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute, keywords } = body;

    const validationError = validateNamingInput({ lastName, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute });
    if (validationError) {
      return jsonWithCors(req, { error: validationError }, { status: 400 });
    }

    const namingId = generateNamingId();

    // DB에 저장
    await createNaming({
      id: namingId,
      lastName: lastName.trim(),
      gender,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute,
      keywords: keywords || undefined,
      paymentStatus: defaultPaymentStatus,
    });

    // after()로 응답 후에도 함수가 살아있도록 보장
    after(async () => {
      try {
        await updateGenerationStatus(namingId, 'generating');
        const { parsed, raw } = await generateNaming({
          lastName: lastName.trim(),
          gender,
          birthYear,
          birthMonth,
          birthDay,
          birthHour,
          birthMinute,
          keywords,
        });
        await saveNamingResult(namingId, parsed, raw);
      } catch (error) {
        console.error('Generation error:', error);
        await updateGenerationStatus(namingId, 'failed');
      }
    });

    return jsonWithCors(req, { namingId });
  } catch (error) {
    console.error('Create naming error:', error);
    return jsonWithCors(
      req,
      { error: '작명 요청 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
