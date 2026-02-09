import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--gray-100)] bg-white mt-auto">
      <div className="max-w-lg mx-auto px-5 py-8">
        <div className="flex items-center justify-between text-sm text-[var(--gray-400)]">
          <span>AI작명소</span>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-[var(--gray-600)] transition-colors">
              개인정보처리방침
            </Link>
            <Link href="/terms" className="hover:text-[var(--gray-600)] transition-colors">
              이용약관
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
