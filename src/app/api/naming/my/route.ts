import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import { getUserNamings } from '@/lib/supabase/queries';

// 현재 로그인 유저의 모든 작명 조회
export async function GET(req: NextRequest) {
  try {
    const supabase = await createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const requestedUserId = req.nextUrl.searchParams.get('userId');
    if (requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const namings = await getUserNamings(user.id);

    return NextResponse.json({ namings });
  } catch (error) {
    console.error('Get user namings error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch namings' },
      { status: 500 }
    );
  }
}
