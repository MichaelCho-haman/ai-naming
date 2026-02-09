import { NextRequest, NextResponse } from 'next/server';
import { getNaming, updateGenerationStatus, saveNamingResult } from '@/lib/supabase/queries';
import { generateNaming } from '@/lib/gpt/naming-generator';

export async function POST(req: NextRequest) {
  try {
    const { namingId } = await req.json();

    if (!namingId) {
      return NextResponse.json({ error: 'Missing namingId' }, { status: 400 });
    }

    const naming = await getNaming(namingId);
    if (!naming) {
      return NextResponse.json({ error: 'Naming not found' }, { status: 404 });
    }

    if (naming.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    if (naming.generation_status === 'completed') {
      return NextResponse.json({ status: 'already_completed' });
    }

    await updateGenerationStatus(namingId, 'generating');

    const { parsed, raw } = await generateNaming({
      lastName: naming.last_name,
      gender: naming.gender,
      birthYear: naming.birth_year,
      birthMonth: naming.birth_month,
      birthDay: naming.birth_day,
      birthHour: naming.birth_hour,
      birthMinute: naming.birth_minute,
      keywords: naming.keywords,
    });

    await saveNamingResult(namingId, parsed, raw);

    return NextResponse.json({ status: 'completed' });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to generate naming' },
      { status: 500 }
    );
  }
}
