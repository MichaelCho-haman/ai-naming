'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

interface NamingFormData {
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-5 py-12"><div className="skeleton h-64 rounded-2xl" /></div>}>
      <CheckoutContent />
    </Suspense>
  );
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');

  const [input, setInput] = useState<NamingFormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('namingInput');
    if (saved) {
      setInput(JSON.parse(saved));
    } else {
      router.push('/naming');
    }
  }, [router]);

  const handleCheckout = async () => {
    if (!input) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || '결제 세션 생성에 실패했습니다');
        return;
      }

      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!input) return null;

  const genderText = input.gender === 'male' ? '남자' : '여자';

  return (
    <div className="max-w-lg mx-auto px-5 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
        입력 정보 확인
      </h1>
      <p className="text-[var(--gray-500)] mb-8">작명에 사용될 정보를 확인해주세요</p>

      {cancelled && (
        <div className="bg-yellow-50 text-yellow-800 px-4 py-3 rounded-xl mb-6 text-sm">
          결제가 취소되었습니다. 다시 시도해주세요.
        </div>
      )}

      <Card className="mb-6">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[var(--gray-500)]">성(姓)</span>
            <span className="font-semibold text-[var(--gray-900)]">{input.lastName}</span>
          </div>
          <div className="h-px bg-[var(--gray-100)]" />
          <div className="flex justify-between items-center">
            <span className="text-[var(--gray-500)]">성별</span>
            <span className="font-semibold text-[var(--gray-900)]">{genderText}</span>
          </div>
          {input.birthYear && (
            <>
              <div className="h-px bg-[var(--gray-100)]" />
              <div className="flex justify-between items-center">
                <span className="text-[var(--gray-500)]">생년월일</span>
                <span className="font-semibold text-[var(--gray-900)]">
                  {input.birthYear}년 {input.birthMonth}월 {input.birthDay}일
                  {input.birthHour !== undefined && ` ${input.birthHour}시`}
                  {input.birthMinute !== undefined && ` ${input.birthMinute}분`}
                </span>
              </div>
            </>
          )}
          {input.keywords && (
            <>
              <div className="h-px bg-[var(--gray-100)]" />
              <div className="flex justify-between items-center">
                <span className="text-[var(--gray-500)]">원하는 느낌</span>
                <span className="font-semibold text-[var(--gray-900)]">{input.keywords}</span>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card className="mb-8 bg-[var(--blue-light)] border-none">
        <div className="flex justify-between items-center">
          <div>
            <div className="font-bold text-[var(--gray-900)]">AI 작명 서비스</div>
            <div className="text-sm text-[var(--gray-500)]">이름 5개 + 상세 분석</div>
          </div>
          <div className="text-2xl font-bold text-[var(--blue-primary)]">₩990</div>
        </div>
      </Card>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      <Button onClick={handleCheckout} loading={loading}>
        결제하기
      </Button>

      <button
        onClick={() => router.push('/naming')}
        className="w-full mt-3 text-center text-sm text-[var(--gray-400)] hover:text-[var(--gray-600)] transition-colors py-2"
      >
        정보 수정하기
      </button>
    </div>
  );
}
