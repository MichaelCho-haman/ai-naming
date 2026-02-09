'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface NamingSummary {
  id: string;
  last_name: string;
  gender: string;
  keywords: string | null;
  naming_content: {
    names: Array<{ koreanName: string; score: number }>;
  } | null;
  created_at: string;
}

export default function MyNamingsPage() {
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [namings, setNamings] = useState<NamingSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setLoading(false);
      return;
    }

    fetch('/api/naming/my')
      .then(res => res.json())
      .then(data => {
        setNamings(data.namings || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="max-w-lg mx-auto px-5 py-12">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center animate-fade-in">
        <div className="text-5xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-3">
          로그인이 필요합니다
        </h1>
        <p className="text-[var(--gray-500)] mb-8">
          작명 결과를 저장하고 관리하려면 로그인해주세요
        </p>
        <Button onClick={() => signInWithGoogle('/my-namings')}>
          Google로 로그인
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">내 작명</h1>
      <p className="text-[var(--gray-500)] mb-8">저장된 작명 결과를 확인하세요</p>

      {namings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">📝</div>
          <p className="text-[var(--gray-500)] mb-6">아직 작명 결과가 없습니다</p>
          <Button onClick={() => router.push('/naming')} variant="secondary" size="md">
            작명 시작하기
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {namings.map(naming => (
            <Card
              key={naming.id}
              onClick={() => router.push(`/result/${naming.id}`)}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-[var(--gray-900)]">
                    {naming.last_name}씨 {naming.gender === 'male' ? '남아' : '여아'} 작명
                  </div>
                  {naming.naming_content?.names && (
                    <div className="text-sm text-[var(--gray-500)] mt-1">
                      {naming.naming_content.names.slice(0, 3).map(n => n.koreanName).join(', ')} 외
                    </div>
                  )}
                  <div className="text-xs text-[var(--gray-400)] mt-1">
                    {new Date(naming.created_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <svg className="w-5 h-5 text-[var(--gray-300)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
