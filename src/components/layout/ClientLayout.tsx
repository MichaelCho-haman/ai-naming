'use client';

import dynamic from 'next/dynamic';
import Footer from './Footer';

const Header = dynamic(() => import('./Header'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
