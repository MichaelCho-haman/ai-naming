import { NextRequest, NextResponse, after } from 'next/server';
import { createNaming, updateGenerationStatus, saveNamingResult } from '@/lib/supabase/queries';
import { generateNamingId } from '@/lib/utils/id-generator';
import { validateNamingInput } from '@/lib/utils/validation';
import { generateNaming } from '@/lib/gpt/naming-generator';

export const maxDuration = 60;

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
          koreanNameOnly: !!koreanNameOnly,
        });
        await saveNamingResult(namingId, parsed, raw);
      } catch (error) {
        console.error('Generation error:', error);
        await updateGenerationStatus(namingId, 'failed');
      }
    });

    return NextResponse.json({ namingId });
  } catch (error) {
    console.error('Create naming error:', error);
    return NextResponse.json(
      { error: '작명 요청 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
