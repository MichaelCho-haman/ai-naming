import { NextRequest } from 'next/server';
import { getNaming } from '@/lib/supabase/queries';
import { maskLockedNames } from '@/lib/naming/result-access';
import { jsonWithCors, preflight } from '@/lib/http/cors';

export async function OPTIONS(req: NextRequest) {
  return preflight(req);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const naming = await getNaming(id);
  if (!naming) {
    return jsonWithCors(req, { error: 'Naming not found' }, { status: 404 });
  }

  const shouldLockPaidContent = naming.payment_status !== 'paid' && naming.payment_status !== 'free';
  const namingContent =
    naming.naming_content && shouldLockPaidContent
      ? maskLockedNames(naming.naming_content, true)
      : naming.naming_content;

  return jsonWithCors(req, {
    id: naming.id,
    lastName: naming.last_name,
    gender: naming.gender,
    birthYear: naming.birth_year,
    birthMonth: naming.birth_month,
    birthDay: naming.birth_day,
    keywords: naming.keywords,
    namingContent,
    paymentStatus: naming.payment_status,
    generationStatus: naming.generation_status,
    orderId: naming.order_id,
    paidAt: naming.paid_at,
    createdAt: naming.created_at,
  });
}
