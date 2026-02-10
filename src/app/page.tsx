import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="px-5 pt-16 pb-12 max-w-lg mx-auto text-center">
        <div className="inline-flex items-center gap-1.5 bg-[var(--blue-light)] text-[var(--blue-primary)] text-sm font-medium px-3 py-1.5 rounded-full mb-6">
          AI 기반 작명 서비스
        </div>
        <h1 className="text-[32px] leading-[1.3] font-bold text-[var(--gray-900)] mb-4 break-keep">
          아이에게 줄 수 있는<br />
          가장 좋은 첫 선물
        </h1>
        <p className="text-lg text-[var(--gray-500)] mb-10 leading-relaxed break-keep">
          사주 분석 기반, 음양오행/획수/한자를<br />
          모두 고려한 완벽한 이름을 추천합니다
        </p>
        <Link href="/naming">
          <Button>
            무료로 작명 시작하기
          </Button>
        </Link>
      </section>

      {/* Features */}
      <section className="px-5 py-12 max-w-lg mx-auto">
        <div className="space-y-4">
          <Card className="animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl shrink-0">
                🤖
              </div>
              <div>
                <h3 className="font-bold text-[var(--gray-900)] mb-1">AI 정밀 분석</h3>
                <p className="text-sm text-[var(--gray-500)] leading-relaxed">
                  30년 경력의 작명 전문가 수준의 AI가 수천 가지 조합을 분석하여 최적의 이름 5개를 추천합니다
                </p>
              </div>
            </div>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-2xl shrink-0">
                ☯️
              </div>
              <div>
                <h3 className="font-bold text-[var(--gray-900)] mb-1">음양오행 분석</h3>
                <p className="text-sm text-[var(--gray-500)] leading-relaxed">
                  생년월일시 기반의 사주와 조화를 이루는 이름을 추천하여 운명의 균형을 맞춥니다
                </p>
              </div>
            </div>
          </Card>

          <Card className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-2xl shrink-0">
                📊
              </div>
              <div>
                <h3 className="font-bold text-[var(--gray-900)] mb-1">완벽한 획수 분석</h3>
                <p className="text-sm text-[var(--gray-500)] leading-relaxed">
                  천격, 인격, 지격, 외격, 총격 — 5가지 획수를 모두 분석하여 길한 이름만 추천합니다
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-12 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-[var(--gray-900)] mb-6 text-center">이렇게 진행돼요</h2>
        <div className="space-y-6">
          {[
            { step: '1', title: '기본 정보 입력', desc: '성, 성별, 생년월일을 알려주세요' },
            { step: '2', title: 'AI가 분석 중', desc: '수천 가지 조합을 분석합니다 (약 30초)' },
            { step: '3', title: '결과 확인', desc: '추천 이름 5개 + 상세 분석을 확인하세요' },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-[var(--blue-primary)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                {item.step}
              </div>
              <div>
                <h3 className="font-semibold text-[var(--gray-900)]">{item.title}</h3>
                <p className="text-sm text-[var(--gray-500)]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="px-5 py-12 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-[var(--gray-900)] mb-6 text-center">자주 묻는 질문</h2>
        <div className="space-y-3">
          {[
            { q: '어떤 정보가 필요한가요?', a: '성(姓), 성별, 생년월일시만 있으면 됩니다. 원하는 느낌이나 키워드를 추가할 수도 있어요.' },
            { q: '이름은 몇 개 받을 수 있나요?', a: '총 5개의 이름을 추천받으며, 각 이름마다 한자 의미, 획수 분석, 오행 분석, 종합 점수가 포함됩니다.' },
            { q: '결과를 다시 볼 수 있나요?', a: '네! 결과 링크를 저장하면 언제든 다시 확인할 수 있습니다.' },
            { q: '정말 무료인가요?', a: '네, 현재 무료로 제공되고 있습니다. 부담 없이 이용해보세요!' },
          ].map((item, i) => (
            <Card key={i}>
              <h3 className="font-semibold text-[var(--gray-900)] mb-2">{item.q}</h3>
              <p className="text-sm text-[var(--gray-500)] leading-relaxed">{item.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-5 py-12 max-w-lg mx-auto text-center">
        <h2 className="text-2xl font-bold text-[var(--gray-900)] mb-3 break-keep">
          지금 바로 시작하세요
        </h2>
        <p className="text-[var(--gray-500)] mb-8">로그인도 결제도 필요 없어요</p>
        <Link href="/naming">
          <Button>
            무료로 작명 시작하기
          </Button>
        </Link>
      </section>
    </div>
  );
}
