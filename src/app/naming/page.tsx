'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Card from '@/components/ui/Card';

const KEYWORD_OPTIONS = [
  '강인한', '지적인', '따뜻한', '밝은', '고귀한',
  '자유로운', '성실한', '창의적인', '우아한', '리더십',
];

export default function NamingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState<string>('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthHour, setBirthHour] = useState('');
  const [birthMinute, setBirthMinute] = useState('');
  const [selectedKeywords, setSelectedKeywords] = useState<string[]>([]);
  const [koreanNameOnly, setKoreanNameOnly] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const totalSteps = 4;

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
        const res = await fetch('/api/naming/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastName: lastName.trim(),
            gender,
            birthYear: birthYear ? Number(birthYear) : undefined,
            birthMonth: birthMonth ? Number(birthMonth) : undefined,
            birthDay: birthDay ? Number(birthDay) : undefined,
            birthHour: birthHour ? Number(birthHour) : undefined,
            birthMinute: birthMinute ? Number(birthMinute) : undefined,
            keywords: selectedKeywords.join(', ') || undefined,
            koreanNameOnly,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || '작명 요청에 실패했습니다');
          setSubmitting(false);
          return;
        }
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

      {/* Step 3: 생년월일시 */}
      {step === 3 && (
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
            생년월일시를<br />입력해주세요
          </h1>
          <p className="text-[var(--gray-500)] mb-8">사주 분석에 활용됩니다 (선택)</p>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="년"
                type="number"
                placeholder="2026"
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
              />
              <Input
                label="월"
                type="number"
                placeholder="1"
                min={1}
                max={12}
                value={birthMonth}
                onChange={e => setBirthMonth(e.target.value)}
              />
              <Input
                label="일"
                type="number"
                placeholder="1"
                min={1}
                max={31}
                value={birthDay}
                onChange={e => setBirthDay(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="시"
                type="number"
                placeholder="13"
                min={0}
                max={23}
                value={birthHour}
                onChange={e => setBirthHour(e.target.value)}
              />
              <Input
                label="분"
                type="number"
                placeholder="30"
                min={0}
                max={59}
                value={birthMinute}
                onChange={e => setBirthMinute(e.target.value)}
              />
            </div>
            <p className="text-xs text-[var(--gray-400)] text-center">
              모르는 항목은 비워두셔도 됩니다
            </p>
          </div>
        </div>
      )}

      {/* Step 4: 키워드 */}
      {step === 4 && (
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

          <label className="flex items-center gap-3 mt-6 p-4 bg-[var(--gray-50)] rounded-2xl cursor-pointer">
            <input
              type="checkbox"
              checked={koreanNameOnly}
              onChange={e => setKoreanNameOnly(e.target.checked)}
              className="w-5 h-5 rounded accent-[var(--blue-primary)]"
            />
            <div>
              <span className="text-sm font-medium text-[var(--gray-900)]">한글 이름으로 작명</span>
              <p className="text-xs text-[var(--gray-400)] mt-0.5">한자 없이 순우리말 이름을 추천받습니다</p>
            </div>
          </label>
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
