import type { NameSuggestion, StrokeAnalysis } from '@/types';
import trendingHanjaRaw from './data/trending-hanja-mapped.json';

interface TrendingHanjaCharEntry {
  character: string;
  reading: string;
  meaning: string;
  full_meaning?: string | null;
  strokes: number;
  element: string;
}

interface TrendingHanjaEntry {
  rank: number;
  name: string;
  gender: 'male' | 'female';
  usage_count: number;
  popularity_score: number;
  hanja: {
    characters: string;
    meaning: string;
    chars: TrendingHanjaCharEntry[];
  };
}

interface TrendingHanjaDataset {
  names: TrendingHanjaEntry[];
}

const dataset = trendingHanjaRaw as TrendingHanjaDataset;

const TRENDING_HANJA_ENTRIES: readonly TrendingHanjaEntry[] = [...dataset.names]
  .filter((entry) => entry.gender === 'male' || entry.gender === 'female')
  .sort((a, b) => a.rank - b.rank);

function normalizeGender(gender: string): 'male' | 'female' {
  return gender === 'female' ? 'female' : 'male';
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function emptyStrokeAnalysis(): StrokeAnalysis {
  return {
    cheongyeok: { value: 0, description: '' },
    ingyeok: { value: 0, description: '' },
    jigyeok: { value: 0, description: '' },
    oegyeok: { value: 0, description: '' },
    chonggyeok: { value: 0, description: '' },
  };
}

function buildCharMeaning(char: TrendingHanjaCharEntry): string {
  const fullMeaning = char.full_meaning?.trim();
  if (fullMeaning) {
    return `${fullMeaning} - ${char.meaning}`;
  }
  return char.meaning;
}

export function findTrendingHanjaEntryByName(
  name: string,
  gender: string
): TrendingHanjaEntry | null {
  const normalizedName = name.trim();
  if (!normalizedName) return null;

  const normalizedGender = normalizeGender(gender);
  const found = TRENDING_HANJA_ENTRIES.find(
    (entry) => entry.gender === normalizedGender && entry.name === normalizedName
  );
  return found ?? null;
}

export function pickTrendingHanjaEntry(params: {
  gender: string;
  seed: string;
  excludeNames?: string[];
}): TrendingHanjaEntry | null {
  const normalizedGender = normalizeGender(params.gender);
  const excludes = new Set((params.excludeNames ?? []).map((name) => name.trim()).filter(Boolean));

  const genderPool = TRENDING_HANJA_ENTRIES.filter(
    (entry) => entry.gender === normalizedGender && !excludes.has(entry.name)
  );

  if (genderPool.length === 0) {
    return null;
  }

  const topWindowSize = Math.min(genderPool.length, 20);
  const topPool = genderPool.slice(0, topWindowSize);
  const index = hashString(`${params.seed}|trending-hanja`) % topPool.length;
  return topPool[index];
}

export function createTrendingHanjaSuggestion(
  lastName: string,
  entry: TrendingHanjaEntry
): NameSuggestion {
  const elementFlow = entry.hanja.chars.map((char) => char.element).join('-');
  const score = Math.max(84, 98 - Math.floor((entry.rank - 1) / 10));

  return {
    koreanName: `${lastName}${entry.name}`,
    hanjaName: entry.hanja.characters,
    hanjaChars: entry.hanja.chars.map((char) => ({
      character: char.character,
      meaning: buildCharMeaning(char),
      strokes: char.strokes,
      element: char.element,
    })),
    strokeAnalysis: emptyStrokeAnalysis(),
    fiveElements: `${entry.hanja.characters} (${elementFlow}) 조합으로 구성된 인기 한자 이름입니다.`,
    energyInterpretation: entry.hanja.meaning,
    score,
  };
}
