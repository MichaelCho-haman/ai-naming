import { NextRequest, NextResponse, after } from 'next/server';
import {
  createNaming,
  countNamingsByFingerprint,
  updateGenerationStatus,
  saveNamingResult,
} from '@/lib/supabase/queries';
import { generateNamingId } from '@/lib/utils/id-generator';
import { validateNamingInput } from '@/lib/utils/validation';
import { generateNamingFromPopularDb } from '@/lib/naming/popular-name-generator';
import { jsonWithCors, preflight } from '@/lib/http/cors';

export const maxDuration = 60;
const appTarget = process.env.NEXT_PUBLIC_APP_TARGET ?? 'web';
const defaultPaymentStatus = appTarget === 'toss' ? 'pending' : 'free';
const KEYWORD_ORDER = [
  '강인한', '지적인', '따뜻한', '밝은', '고귀한',
  '자유로운', '성실한', '창의적인', '우아한', '리더십',
];

function normalizeKeywords(input?: string) {
  if (!input) return undefined;
  const unique = new Set<string>();
  for (const rawKeyword of input.split(',')) {
    const keyword = rawKeyword.trim();
    if (!keyword) continue;
    unique.add(keyword);
  }
  if (unique.size === 0) return undefined;
  return [...unique]
    .sort((a, b) => {
      const aIdx = KEYWORD_ORDER.indexOf(a);
      const bIdx = KEYWORD_ORDER.indexOf(b);
      if (aIdx === -1 && bIdx === -1) return a.localeCompare(b, 'ko');
      if (aIdx === -1) return 1;
      if (bIdx === -1) return -1;
      return aIdx - bIdx;
    })
    .join(', ');
}

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
    const normalizedKeywords = normalizeKeywords(
      typeof keywords === 'string' ? keywords : undefined
    );
    const previousCount = await countNamingsByFingerprint({
      lastName: lastName.trim(),
      gender,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute,
      keywords: normalizedKeywords,
    });
    const requestIndex = previousCount + 1;

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
      keywords: normalizedKeywords || undefined,
      paymentStatus: defaultPaymentStatus,
    });

    // after()로 응답 후에도 함수가 살아있도록 보장
    after(async () => {
      try {
        await updateGenerationStatus(namingId, 'generating');
        const { parsed, raw } = await generateNamingFromPopularDb({
          lastName: lastName.trim(),
          gender,
          birthYear,
          birthMonth,
          birthDay,
          birthHour,
          birthMinute,
          keywords: normalizedKeywords,
          requestIndex,
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
