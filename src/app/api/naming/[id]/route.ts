import { NextRequest, NextResponse } from 'next/server';
import { getNaming } from '@/lib/supabase/queries';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const naming = await getNaming(id);
  if (!naming) {
    return NextResponse.json({ error: 'Naming not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: naming.id,
    lastName: naming.last_name,
    gender: naming.gender,
    birthYear: naming.birth_year,
    birthMonth: naming.birth_month,
    birthDay: naming.birth_day,
    keywords: naming.keywords,
    namingContent: naming.naming_content,
    paymentStatus: naming.payment_status,
    generationStatus: naming.generation_status,
    createdAt: naming.created_at,
  });
}
