'use client';

import { useState, useEffect, useCallback } from 'react';

interface NamingStatus {
  generationStatus: string;
  namingContent: unknown;
}

export function useNamingStatus(namingId: string | null) {
  const [status, setStatus] = useState<string>('pending');
  const [data, setData] = useState<NamingStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!namingId) return;

    try {
      const res = await fetch(`/api/naming/${namingId}`);
      if (!res.ok) {
        setError('작명 결과를 찾을 수 없습니다');
        return;
      }

      const json = await res.json();
      setStatus(json.generationStatus);
      setData(json);

      if (json.generationStatus === 'completed' || json.generationStatus === 'failed') {
        return true; // stop polling
      }
    } catch {
      setError('상태 확인 실패');
    }

    return false;
  }, [namingId]);

  useEffect(() => {
    if (!namingId) return;

    let timer: NodeJS.Timeout;
    let stopped = false;

    const poll = async () => {
      const done = await fetchStatus();
      if (!done && !stopped) {
        timer = setTimeout(poll, 2000);
      }
    };

    poll();

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [namingId, fetchStatus]);

  return { status, data, error };
}
