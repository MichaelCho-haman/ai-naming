'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useNamingStatus } from '@/hooks/useNamingStatus';

const LOADING_MESSAGES = [
  '고민하고 있어요...',
  '행복한 아이였으면 좋겠어요...',
  '기운을 느끼고 있어요...',
  '좋은 기운을 발견했어요...',
  '좋은 이름을 찾고 있어요...',
  '이름의 음양오행을 검수하는중...',
  '글자들의 궁합을 보는 중...',
  '이름의 느낌을 다듬고 있어요...',
  '조금 더 행복하길 기도하는 중...',
  '최적의 조합을 골라내는 중...',
  '마지막 점검을 하고 있어요...',
  '거의 다 됐어요!',
];

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-5 py-20 text-center"><div className="relative w-20 h-20 mx-auto"><div className="absolute inset-0 rounded-full border-4 border-[var(--gray-100)]" /><div className="absolute inset-0 rounded-full border-4 border-[var(--blue-primary)] border-t-transparent animate-spin" /></div></div>}>
      <SuccessContent />
    </Suspense>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const namingId = searchParams.get('naming_id');
  const { status } = useNamingStatus(namingId);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (status === 'completed' && namingId) {
      router.push(`/result/${namingId}`);
    }
  }, [status, namingId, router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  if (status === 'failed') {
    return (
      <div className="max-w-lg mx-auto px-5 py-20 text-center animate-fade-in">
        <div className="text-5xl mb-6">😔</div>
        <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-3">
          작명 생성에 실패했어요
        </h1>
        <p className="text-[var(--gray-500)] mb-8">
          문제가 지속되면 고객센터로 문의해주세요
        </p>
        <button
          onClick={() => router.push('/naming')}
          className="text-[var(--blue-primary)] font-medium hover:underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-20 text-center animate-fade-in">
      <div className="mb-10">
        <div className="relative w-20 h-20 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-[var(--gray-100)]" />
          <div className="absolute inset-0 rounded-full border-4 border-[var(--blue-primary)] border-t-transparent animate-spin" />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-3">
        AI가 이름을 짓고 있어요
      </h1>

      <p className="text-lg text-[var(--gray-500)] h-7 transition-all duration-500">
        {LOADING_MESSAGES[messageIndex]}
      </p>

      <div className="mt-12 flex justify-center gap-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[var(--blue-primary)] animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
