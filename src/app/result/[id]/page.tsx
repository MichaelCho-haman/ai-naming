import { getNaming, incrementViewCount } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';
import { NamingResult } from '@/types';
import ResultClient from './ResultClient';
import { isTossTarget, shouldRequireUnlock } from '@/lib/config/platform';
import { maskLockedNames } from '@/lib/naming/result-access';

export default async function ResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const naming = await getNaming(id);
  if (!naming || naming.generation_status !== 'completed') {
    notFound();
  }
  const isLocked = shouldRequireUnlock(naming.payment_status);
  const result = maskLockedNames(naming.naming_content as NamingResult, isLocked);

  // 조회수 증가
  incrementViewCount(id).catch(() => {});

  return (
    <ResultClient
      namingId={id}
      lastName={naming.last_name}
      gender={naming.gender}
      result={result}
      paymentStatus={naming.payment_status}
      isTossTarget={isTossTarget}
    />
  );
}
