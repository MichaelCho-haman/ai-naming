import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--gray-100)] bg-white mt-auto">
      <div className="max-w-lg mx-auto px-5 py-8">
        {/* 링크 */}
        <div className="flex items-center justify-between text-sm text-[var(--gray-400)] mb-6">
          <span className="font-medium text-[var(--gray-600)]">애기 이름짓기</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[var(--gray-600)] transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="hover:text-[var(--gray-600)] transition-colors">
              이용약관
            </Link>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="text-xs text-[var(--gray-400)] leading-relaxed space-y-1">
          <p>블리스박스 | 대표: 김수민 | 개인정보관리책임자: 김수민</p>
          <p>사업자등록번호: 746-59-00837 | 통신판매업 신고: 2024-경기하남-2754</p>
          <p>주소: 경기도 하남시 망월동 1100 힐스테이트미사역그랑파사쥬 2층 2012호</p>
          <p>전화: 010-5343-5007 | 이메일: papasfactory@kakao.com</p>
        </div>
      </div>
    </footer>
  );
}
