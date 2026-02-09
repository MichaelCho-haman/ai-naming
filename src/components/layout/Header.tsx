'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';

export default function Header() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-[var(--gray-100)]">
      <div className="max-w-lg mx-auto px-5 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-[var(--blue-primary)]">
          AI작명소
        </Link>

        <div className="flex items-center gap-3">
          {!loading && (
            <>
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="flex items-center gap-2 text-sm text-[var(--gray-600)] hover:text-[var(--gray-900)] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--blue-light)] flex items-center justify-center text-[var(--blue-primary)] font-medium text-sm">
                      {user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  </button>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-[var(--gray-100)] py-1 z-50">
                        <Link
                          href="/my-namings"
                          className="block px-4 py-2.5 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                          onClick={() => setMenuOpen(false)}
                        >
                          내 작명 목록
                        </Link>
                        <button
                          onClick={() => { signOut(); setMenuOpen(false); }}
                          className="block w-full text-left px-4 py-2.5 text-sm text-[var(--gray-700)] hover:bg-[var(--gray-50)]"
                        >
                          로그아웃
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => signInWithGoogle()}
                  className="text-sm font-medium text-[var(--gray-600)] hover:text-[var(--blue-primary)] transition-colors"
                >
                  로그인
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </header>
  );
}
