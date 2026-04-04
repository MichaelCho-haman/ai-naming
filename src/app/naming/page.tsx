'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';
import {
  buildNamingRequestFingerprint,
  getCachedNamingId,
  setCachedNamingId,
} from '@/lib/naming/request-cache';

const KEYWORD_OPTIONS = [
  '강인한', '지적인', '따뜻한', '밝은', '고귀한',
  '자유로운', '성실한', '창의적인', '우아한', '리더십',
];
const KEYWORD_ORDER = KEYWORD_OPTIONS.reduce<Record<string, number>>((acc, keyword, index) => {
  acc[keyword] = index;
  return acc;
}, {});

function toNormalizedKeywordString(selectedKeywords: string[]) {
  if (selectedKeywords.length === 0) return undefined;
  return [...selectedKeywords]
    .sort((a, b) => (KEYWORD_ORDER[a] ?? 999) - (KEYWORD_ORDER[b] ?? 999))
    .join(', ');
}

export default function NamingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<string>('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 3;

  const toggleKeyword = (kw: string) => {
    setSelectedKeywords(prev =>
      prev.includes(kw)
        ? prev.filter(k => k !== kw)
        : prev.length < 3 ? [...prev, kw] : prev
    );
  };

  const handleNext = async () => {
    setError('');

    if (step === 1) {
      if (!lastName.trim()) {
        setError('성(姓)을 입력해주세요');
        return;
      }
      if (lastName.trim().length > 3) {
        setError('성은 3글자 이하로 입력해주세요');
        return;
      }
    }

    if (step === 2 && !gender) {
      setError('성별을 선택해주세요');
      return;
    }

    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      // 입력 완료 → 바로 작명 API 호출
      setSubmitting(true);
      try {
        const payload = {
          lastName: lastName.trim(),
          gender,
          keywords: toNormalizedKeywordString(selectedKeywords),
        };
        const fingerprint = buildNamingRequestFingerprint(payload);
        const cachedNamingId = getCachedNamingId(fingerprint);

        if (cachedNamingId) {
          const checkRes = await fetch(`/api/naming/${cachedNamingId}`);
          if (checkRes.ok) {
            const checkJson = await checkRes.json();
            if (checkJson.generationStatus === 'pending' || checkJson.generationStatus === 'generating') {
              router.push(`/success?naming_id=${cachedNamingId}`);
              return;
            }
          }
        }

        const res = await fetch('/api/naming/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '작명 요청에 실패했습니다');
          setSubmitting(false);
          return;
        }
        setCachedNamingId(fingerprint, data.namingId);
        router.push(`/success?naming_id=${data.namingId}`);
      } catch {
        setError('네트워크 오류가 발생했습니다');
        setSubmitting(false);
      }
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-8 animate-fade-in">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < step ? 'bg-[var(--blue-primary)]' : 'bg-[var(--gray-200)]'
            }`}
          />
        ))}
      </div>

      {/* Step 1: 성 */}
      {step === 1 && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
            아이의 성(姓)은<br />무엇인가요?
          </h1>
          <p className="text-[var(--gray-500)] mb-8">한글로 입력해주세요</p>
          <Input
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="예: 김"
            autoFocus
            error={error}
            className="text-xl text-center font-medium"
          />
        </div>
      )}

      {/* Step 2: 성별 */}
      {step === 2 && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
            아이의 성별을<br />알려주세요
          </h1>
          <p className="text-[var(--gray-500)] mb-8">성별에 맞는 이름을 추천해드립니다</p>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`text-center cursor-pointer transition-all ${
                gender === 'male'
                  ? 'ring-2 ring-[var(--blue-primary)] bg-[var(--blue-light)]'
                  : 'hover:bg-[var(--gray-50)]'
              }`}
              onClick={() => { setGender('male'); setError(''); }}
            >
              <div className="text-4xl mb-2">👦</div>
              <div className="font-semibold text-[var(--gray-900)]">남자</div>
            </Card>
            <Card
              className={`text-center cursor-pointer transition-all ${
                gender === 'female'
                  ? 'ring-2 ring-[var(--blue-primary)] bg-[var(--blue-light)]'
                  : 'hover:bg-[var(--gray-50)]'
              }`}
              onClick={() => { setGender('female'); setError(''); }}
            >
              <div className="text-4xl mb-2">👧</div>
              <div className="font-semibold text-[var(--gray-900)]">여자</div>
            </Card>
          </div>
          {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
        </div>
      )}

      {/* Step 3: 키워드 */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
            원하는 이름의<br />느낌이 있나요?
          </h1>
          <p className="text-[var(--gray-500)] mb-8">최대 3개 선택 (선택사항)</p>
          <div className="flex flex-wrap gap-2">
            {KEYWORD_OPTIONS.map(kw => (
              <button
                key={kw}
                onClick={() => toggleKeyword(kw)}
                className={`px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                  selectedKeywords.includes(kw)
                    ? 'bg-[var(--blue-primary)] text-white'
                    : 'bg-[var(--gray-100)] text-[var(--gray-700)] hover:bg-[var(--gray-200)]'
                }`}
              >
                {kw}
              </button>
            ))}
          </div>

        </div>
      )}

      {/* Error */}
      {error && step >= 3 && (
        <p className="text-red-500 text-sm mt-4 text-center">{error}</p>
      )}

      {/* Navigation */}
      <div className="mt-10 space-y-3">
        <Button onClick={handleNext} loading={submitting}>
          {step < totalSteps ? '다음' : '작명 시작'}
        </Button>
        {step > 1 && (
          <Button variant="ghost" onClick={() => { setStep(step - 1); setError(''); }}>
            이전
          </Button>
        )}
      </div>
    </div>
  );
}
