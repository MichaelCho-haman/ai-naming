import { NextRequest, NextResponse } from 'next/server';
import { constructEvent } from '@/lib/stripe/webhook';
import { markNamingPaid, updateGenerationStatus, saveNamingResult, getNaming } from '@/lib/supabase/queries';
import { generateNaming } from '@/lib/gpt/naming-generator';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;
  try {
    event = constructEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const namingId = session.metadata?.namingId;

    if (!namingId) {
      console.error('No namingId in session metadata');
      return NextResponse.json({ received: true });
    }

    try {
      // 결제 완료 처리
      await markNamingPaid(session.id);

      // GPT 생성 시작 (비동기)
      triggerGeneration(namingId).catch(console.error);
    } catch (error) {
      console.error('Webhook processing error:', error);
    }
  }

  return NextResponse.json({ received: true });
}

async function triggerGeneration(namingId: string) {
  try {
    await updateGenerationStatus(namingId, 'generating');

    const naming = await getNaming(namingId);
    if (!naming) throw new Error('Naming not found');

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
  } catch (error) {
    console.error('Generation error:', error);
    await updateGenerationStatus(namingId, 'failed');
  }
}
