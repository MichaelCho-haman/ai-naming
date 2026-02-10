'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { NamingResult, NameSuggestion } from '@/types';

interface Props {
  namingId: string;
  lastName: string;
  gender: string;
  result: NamingResult;
}

export default function ResultClient({ lastName, result }: Props) {
  const [expandedIndex, setExpandedIndex] = useState<number>(0);

  const handleShare = async () => {
    const url = window.location.href;
    const text = `AI작명소에서 작명 결과를 확인해보세요!`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'AI작명소 작명 결과', text, url });
      } catch {
        // 무시
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('링크가 복사되었습니다!');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-5 py-8 animate-fade-in">
      <div className="text-center mb-8">
        <div className="text-4xl mb-3">✨</div>
        <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-2">
          {lastName}씨 아이를 위한<br />추천 이름
        </h1>
        <p className="text-[var(--gray-500)]">총 {result.names.length}개의 이름을 추천해드려요</p>
      </div>

      {/* 이름 카드 목록 */}
      <div className="space-y-4 mb-8">
        {result.names.map((name, index) => (
          <NameCard
            key={index}
            name={name}
            lastName={lastName}
            rank={index + 1}
            expanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? -1 : index)}
          />
        ))}
      </div>

      {/* 작명 철학 */}
      {result.philosophy && (
        <Card className="mb-4">
          <h2 className="font-bold text-[var(--gray-900)] mb-3 flex items-center gap-2">
            📖 작명 철학
          </h2>
          <p className="text-sm text-[var(--gray-600)] leading-relaxed whitespace-pre-wrap">
            {result.philosophy}
          </p>
        </Card>
      )}

      {/* 피해야 할 조합 */}
      {result.avoidance && (
        <Card className="mb-8">
          <h2 className="font-bold text-[var(--gray-900)] mb-3 flex items-center gap-2">
            ⚠️ 참고 사항
          </h2>
          <p className="text-sm text-[var(--gray-600)] leading-relaxed whitespace-pre-wrap">
            {result.avoidance}
          </p>
        </Card>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <Button onClick={handleShare} variant="secondary">
          결과 공유하기
        </Button>
        <a href="/naming">
          <Button variant="ghost">
            다시 작명하기
          </Button>
        </a>
      </div>
    </div>
  );
}

function NameCard({
  name,
  lastName,
  rank,
  expanded,
  onToggle,
}: {
  name: NameSuggestion;
  lastName: string;
  rank: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const scoreColor =
    name.score >= 90 ? 'text-green-600 bg-green-50' :
    name.score >= 80 ? 'text-blue-600 bg-blue-50' :
    'text-yellow-600 bg-yellow-50';

  return (
    <Card className="overflow-hidden">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--blue-primary)] text-white flex items-center justify-center text-sm font-bold">
              {rank}
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold text-[var(--gray-900)]">
                  {lastName}{name.koreanName.replace(new RegExp(`^${lastName}`), '')}
                </span>
                <span className="text-sm text-[var(--gray-400)]">{name.hanjaName || '한자 미제공'}</span>
              </div>
            </div>
          </div>
          <div className={`px-2.5 py-1 rounded-lg text-sm font-bold ${scoreColor}`}>
            {name.score}점
          </div>
        </div>
      </button>

      {expanded && (
        <div className="mt-5 pt-5 border-t border-[var(--gray-100)] space-y-5 animate-fade-in">
          {/* 한자 분석 */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-3">한자 의미</h4>
            <div className="space-y-2">
              {name.hanjaChars.map((char, i) => (
                <div key={i} className="flex items-start gap-3 bg-[var(--gray-50)] rounded-xl p-3">
                  <span className="text-2xl font-serif">{char.character}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-[var(--gray-900)]">{char.meaning}</div>
                    <div className="text-xs text-[var(--gray-400)] mt-0.5">
                      {char.strokes}획 · {char.element}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 획수 분석 */}
          <div>
            <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-3">획수 분석</h4>
            <div className="grid grid-cols-5 gap-2">
              {[
                { label: '천격', data: name.strokeAnalysis.cheongyeok },
                { label: '인격', data: name.strokeAnalysis.ingyeok },
                { label: '지격', data: name.strokeAnalysis.jigyeok },
                { label: '외격', data: name.strokeAnalysis.oegyeok },
                { label: '총격', data: name.strokeAnalysis.chonggyeok },
              ].map((item) => (
                <div key={item.label} className="text-center bg-[var(--gray-50)] rounded-xl p-2.5">
                  <div className="text-xs text-[var(--gray-400)] mb-1">{item.label}</div>
                  <div className="text-lg font-bold text-[var(--gray-900)]">{item.data.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 음양오행 */}
          {name.fiveElements && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-2">음양오행</h4>
              <p className="text-sm text-[var(--gray-600)] leading-relaxed">{name.fiveElements}</p>
            </div>
          )}

          {/* 에너지 해석 */}
          {name.energyInterpretation && (
            <div>
              <h4 className="text-sm font-semibold text-[var(--gray-700)] mb-2">이름의 느낌</h4>
              <p className="text-sm text-[var(--gray-600)] leading-relaxed">{name.energyInterpretation}</p>
            </div>
          )}

          {/* 점수 게이지 */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-[var(--gray-700)]">종합 점수</span>
              <span className="text-sm font-bold text-[var(--blue-primary)]">{name.score}/100</span>
            </div>
            <div className="w-full h-2 bg-[var(--gray-100)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--blue-primary)] rounded-full animate-gauge"
                style={{ width: `${name.score}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
