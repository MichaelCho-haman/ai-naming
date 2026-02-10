import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[var(--gray-100)]">
      <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-center">
        <Link href="/" className="text-xl font-bold text-[var(--blue-primary)]">
          AI작명소
        </Link>
      </div>
    </header>
  );
}
