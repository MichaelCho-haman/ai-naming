import Card from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <div className="max-w-lg mx-auto px-5 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-8">이용약관</h1>

      <Card>
        <div className="prose prose-sm max-w-none text-[var(--gray-600)] space-y-6">
          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">1. 서비스 개요</h2>
            <p>
              애기 이름짓기는 인공지능(AI)을 활용한 작명 서비스입니다.
              사주 분석, 음양오행, 획수 분석 등을 기반으로 이름을 추천합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">2. 서비스 이용</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>서비스 이용 시 정확한 정보를 입력해주세요</li>
              <li>결제 완료 후 AI가 이름을 생성합니다</li>
              <li>결과는 링크를 통해 언제든 다시 확인할 수 있습니다</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">3. 결제 및 환불</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>서비스 요금: ₩550 (일회성)</li>
              <li>디지털 콘텐츠 특성상 결과 생성 후 환불 불가</li>
              <li>기술적 문제로 결과를 받지 못한 경우 재생성 또는 환불 가능</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">4. 면책 조항</h2>
            <p>
              애기 이름짓기의 추천 이름은 참고용이며, 최종 이름 결정은 사용자의 판단에 따릅니다.
              추천 결과에 대한 법적 책임은 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">5. 지적재산권</h2>
            <p>
              서비스에 사용된 AI 모델, 알고리즘, 디자인 등의 지적재산권은 애기 이름짓기에 귀속됩니다.
              작명 결과 자체는 사용자가 자유롭게 활용할 수 있습니다.
            </p>
          </section>
        </div>
      </Card>
    </div>
  );
}
