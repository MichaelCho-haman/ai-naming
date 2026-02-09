import Card from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="max-w-lg mx-auto px-5 py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-[var(--gray-900)] mb-8">개인정보처리방침</h1>

      <Card>
        <div className="prose prose-sm max-w-none text-[var(--gray-600)] space-y-6">
          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">1. 수집하는 개인정보</h2>
            <p>서비스 이용을 위해 다음 정보를 수집합니다:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>성(姓), 성별, 생년월일시 (작명 서비스 제공용)</li>
              <li>이메일 주소 (소셜 로그인 시)</li>
              <li>결제 정보 (Stripe를 통해 안전하게 처리)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">2. 개인정보의 이용 목적</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>AI 작명 서비스 제공</li>
              <li>결제 처리 및 서비스 이용 기록 관리</li>
              <li>서비스 개선 및 통계 분석</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">3. 개인정보의 보유 및 이용 기간</h2>
            <p>
              서비스 이용 목적이 달성된 후 합리적인 기간 내에 파기합니다.
              단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">4. 개인정보의 제3자 제공</h2>
            <p>
              수집된 개인정보는 원칙적으로 제3자에게 제공하지 않습니다.
              결제 처리를 위해 Stripe에 결제 정보가 전달됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[var(--gray-900)]">5. 문의</h2>
            <p>개인정보 관련 문의사항이 있으시면 이메일로 연락해주세요.</p>
          </section>
        </div>
      </Card>
    </div>
  );
}
