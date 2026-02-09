import { getNaming, incrementViewCount } from '@/lib/supabase/queries';
import { notFound } from 'next/navigation';
import { NamingResult } from '@/types';
import ResultClient from './ResultClient';

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

  // 조회수 증가
  incrementViewCount(id).catch(() => {});

  return (
    <ResultClient
      namingId={id}
      lastName={naming.last_name}
      gender={naming.gender}
      result={naming.naming_content as NamingResult}
    />
  );
}
