interface CachedNamingRequest {
  fingerprint: string;
  namingId: string;
  savedAt: number;
}

const STORAGE_KEY = 'naming_request_cache_v1';
const TTL_MS = 24 * 60 * 60 * 1000;

export interface NamingRequestFingerprintInput {
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
  koreanNameOnly?: boolean;
}

export function buildNamingRequestFingerprint(input: NamingRequestFingerprintInput) {
  return JSON.stringify({
    lastName: input.lastName.trim(),
    gender: input.gender,
    birthYear: input.birthYear ?? null,
    birthMonth: input.birthMonth ?? null,
    birthDay: input.birthDay ?? null,
    birthHour: input.birthHour ?? null,
    birthMinute: input.birthMinute ?? null,
    keywords: input.keywords ?? null,
    koreanNameOnly: !!input.koreanNameOnly,
  });
}

export function getCachedNamingId(fingerprint: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedNamingRequest;
    if (!parsed?.namingId || !parsed?.fingerprint || !parsed?.savedAt) return null;
    if (Date.now() - parsed.savedAt > TTL_MS) return null;
    if (parsed.fingerprint !== fingerprint) return null;
    return parsed.namingId;
  } catch {
    return null;
  }
}

export function setCachedNamingId(fingerprint: string, namingId: string) {
  if (typeof window === 'undefined') return;
  const value: CachedNamingRequest = {
    fingerprint,
    namingId,
    savedAt: Date.now(),
  };
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}
