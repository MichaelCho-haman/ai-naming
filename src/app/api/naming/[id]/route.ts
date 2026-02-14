import { NextRequest, NextResponse } from 'next/server';
import { getNaming } from '@/lib/supabase/queries';
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

  return jsonWithCors(req, {
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
