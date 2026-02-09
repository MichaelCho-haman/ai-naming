import { NextRequest, NextResponse } from 'next/server';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { createNaming } from '@/lib/supabase/queries';
import { createAuthClient } from '@/lib/supabase/server';
import { generateNamingId } from '@/lib/utils/id-generator';
import { validateNamingInput } from '@/lib/utils/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lastName, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute, keywords } = body;

    const validationError = validateNamingInput({ lastName, gender, birthYear, birthMonth, birthDay, birthHour, birthMinute });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // 로그인 유저 확인 (선택적)
    let userId: string | undefined;
    try {
      const supabase = await createAuthClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) userId = user.id;
    } catch {
      // 비로그인 — 무시
    }

    // Naming ID 생성
    const namingId = generateNamingId();

    // Stripe Checkout Session 생성
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const session = await createCheckoutSession({ namingId, baseUrl });

    // DB에 naming 저장
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
      stripeSessionId: session.id,
      userId,
    });

    return NextResponse.json({
      sessionId: session.id,
      sessionUrl: session.url,
      namingId,
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: '결제 세션 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
