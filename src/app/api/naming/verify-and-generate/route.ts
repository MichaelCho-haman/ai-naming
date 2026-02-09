import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getNaming, markNamingPaid, updateGenerationStatus, saveNamingResult } from '@/lib/supabase/queries';
import { generateNaming } from '@/lib/gpt/naming-generator';

// Webhook 실패 대비: Stripe에서 직접 결제 확인 후 생성
export async function POST(req: NextRequest) {
  try {
    const { namingId, sessionId } = await req.json();

    if (!namingId || !sessionId) {
      return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const naming = await getNaming(namingId);
    if (!naming) {
      return NextResponse.json({ error: 'Naming not found' }, { status: 404 });
    }

    // 이미 완료된 경우
    if (naming.generation_status === 'completed') {
      return NextResponse.json({ status: 'already_completed' });
    }

    // 결제 상태가 아직 pending이면 Stripe에서 직접 확인
    if (naming.payment_status !== 'paid') {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status !== 'paid') {
        return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
      }

      // 결제 확인 → DB 업데이트
      await markNamingPaid(session.id);
    }

    // 이미 생성 중이면 대기
    if (naming.generation_status === 'generating') {
      return NextResponse.json({ status: 'generating' });
    }

    // GPT 생성
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
    console.error('Verify and generate error:', error);
    return NextResponse.json(
      { error: 'Failed to verify and generate' },
      { status: 500 }
    );
  }
}
