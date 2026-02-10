import { NextRequest, NextResponse } from 'next/server';
import { createNaming, updateGenerationStatus, saveNamingResult } from '@/lib/supabase/queries';
import { generateNamingId } from '@/lib/utils/id-generator';
import { validateNamingInput } from '@/lib/utils/validation';
import { generateNaming } from '@/lib/gpt/naming-generator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lastName, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute, keywords, koreanNameOnly } = body;

    const validationError = validateNamingInput({ lastName, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
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
    });

    // GPT 생성 비동기 시작
    triggerGeneration(namingId, {
      lastName: lastName.trim(),
      gender,
      birthYear,
      birthMonth,
      birthDay,
      birthHour,
      birthMinute,
      keywords,
      koreanNameOnly: !!koreanNameOnly,
    }).catch(console.error);

    return NextResponse.json({ namingId });
  } catch (error) {
    console.error('Create naming error:', error);
    return NextResponse.json(
      { error: '작명 요청 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}

async function triggerGeneration(namingId: string, params: {
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
  koreanNameOnly?: boolean;
}) {
  try {
    await updateGenerationStatus(namingId, 'generating');
    const { parsed, raw } = await generateNaming(params);
    await saveNamingResult(namingId, parsed, raw);
  } catch (error) {
    console.error('Generation error:', error);
    await updateGenerationStatus(namingId, 'failed');
  }
}
