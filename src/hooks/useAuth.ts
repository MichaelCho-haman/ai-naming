'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createBrowserClient } from '@/lib/supabase/client';
import type { User, SupabaseClient } from '@supabase/supabase-js';

function getSupabase(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('Supabase client is only available in the browser');
  }
  return createBrowserClient();
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabaseRef = useRef<SupabaseClient | null>(null);

  const supabase = () => {
    if (!supabaseRef.current) {
      supabaseRef.current = getSupabase();
    }
    return supabaseRef.current;
  };

  useEffect(() => {
    const sb = supabase();

    sb.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithGoogle = useCallback((redirectTo?: string) => {
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (redirectTo) {
      callbackUrl.searchParams.set('redirect', redirectTo);
    }
    supabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl.toString() },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signInWithApple = useCallback((redirectTo?: string) => {
    const callbackUrl = new URL('/auth/callback', window.location.origin);
    if (redirectTo) {
      callbackUrl.searchParams.set('redirect', redirectTo);
    }
    supabase().auth.signInWithOAuth({
      provider: 'apple',
      options: { redirectTo: callbackUrl.toString() },
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = useCallback(async () => {
    await supabase().auth.signOut();
    setUser(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    user,
    loading,
    signInWithGoogle,
    signInWithApple,
    signOut,
    isLoggedIn: !!user,
  };
}
