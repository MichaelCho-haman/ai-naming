import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import { linkNamingToUser } from '@/lib/supabase/queries';

// 작명을 현재 로그인 유저에 연결
export async function POST(req: NextRequest) {
  try {
    const { namingId } = await req.json();

    if (!namingId) {
      return NextResponse.json({ error: 'Missing namingId' }, { status: 400 });
    }

    const supabase = await createAuthClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await linkNamingToUser(namingId, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Link naming error:', error);
    return NextResponse.json(
      { error: 'Failed to link naming' },
      { status: 500 }
    );
  }
}
