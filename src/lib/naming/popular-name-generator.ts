import type { NamingResult, NameSuggestion, StrokeAnalysis } from '@/types';
import popularScoredNamesRaw from '@/lib/korean/data/popular-scored-names.json';
import { TOTAL_RECOMMENDATION_COUNT } from '@/lib/naming/access-policy';

const CONCEPT_KEYS = [
  '강인한',
  '지적인',
  '따뜻한',
  '밝은',
  '고귀한',
  '자유로운',
  '성실한',
  '창의적인',
  '우아한',
  '리더십',
] as const;

type ConceptKey = (typeof CONCEPT_KEYS)[number];
type Gender = 'male' | 'female';

interface PopularNameRow {
  gender: Gender;
  name: string;
  rank: number;
  conceptScores: Record<ConceptKey, number>;
}

interface PopularNameDataset {
  names: PopularNameRow[];
}

interface GenerateFromDbParams {
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
  requestIndex: number;
}

const dataset = popularScoredNamesRaw as PopularNameDataset;

function normalizeGender(gender: string): Gender {
  return gender === 'female' ? 'female' : 'male';
}

function parseSelectedConcepts(keywords?: string): ConceptKey[] {
  if (!keywords) return [];

  const set = new Set<ConceptKey>();
  for (const raw of keywords.split(',')) {
    const key = raw.trim() as ConceptKey;
    if (CONCEPT_KEYS.includes(key)) {
      set.add(key);
    }
  }
  return Array.from(set);
}

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRng(seed: string) {
  let state = hashString(seed) || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return ((state >>> 0) % 1_000_000) / 1_000_000;
  };
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

function buildSeed(params: GenerateFromDbParams): string {
  return [
    params.lastName.trim(),
    normalizeGender(params.gender),
    params.birthYear ?? '',
    params.birthMonth ?? '',
    params.birthDay ?? '',
    params.birthHour ?? '',
    params.birthMinute ?? '',
    params.keywords ?? '',
    params.requestIndex,
  ].join('|');
}

function getRankWindow(rows: PopularNameRow[], requestIndex: number): PopularNameRow[] {
  if (requestIndex <= 1) {
    const top = rows.filter((row) => row.rank >= 1 && row.rank <= 30);
    return top.length > 0 ? top : rows;
  }
  const tail = rows.filter((row) => row.rank >= 31);
  return tail.length > 0 ? tail : rows;
}

function pickWeightedUnique<T>(
  pool: T[],
  count: number,
  getWeight: (item: T) => number,
  rng: () => number
): T[] {
  const work = [...pool];
  const selected: T[] = [];

  while (selected.length < count && work.length > 0) {
    const weights = work.map((item) => Math.max(0.0001, getWeight(item)));
    const total = weights.reduce((acc, weight) => acc + weight, 0);
    let roll = rng() * total;
    let index = 0;
    for (; index < work.length; index += 1) {
      roll -= weights[index];
      if (roll <= 0) break;
    }
    const pickedIndex = Math.min(index, work.length - 1);
    const [picked] = work.splice(pickedIndex, 1);
    selected.push(picked);
  }

  return selected;
}

function computeCompositeScore(row: PopularNameRow, selectedConcepts: ConceptKey[]) {
  if (selectedConcepts.length === 0) {
    return 0;
  }
  return selectedConcepts.reduce((acc, key) => acc + (row.conceptScores[key] ?? 0), 0);
}

function toSuggestion(params: {
  row: PopularNameRow;
  lastName: string;
  selectedConcepts: ConceptKey[];
  rankWindowLabel: string;
}): NameSuggestion {
  const { row, lastName, selectedConcepts, rankWindowLabel } = params;
  const conceptScore = computeCompositeScore(row, selectedConcepts);
  const rankNormalized = (501 - Math.max(1, Math.min(row.rank, 500))) / 500; // 0~1
  const baseScore = 70 + rankNormalized * 20;
  const conceptBonus =
    selectedConcepts.length > 0
      ? ((conceptScore / (selectedConcepts.length * 5)) * 10)
      : 0;
  const score = Math.max(60, Math.min(99, Math.round(baseScore + conceptBonus)));

  const keywordMessage =
    selectedConcepts.length > 0
      ? '선택 키워드 반영, 최근 출생 신고가 많은 이름들로 추렸어요.'
      : '선택 키워드 미반영, 인기 랭킹 기반 랜덤 추천이에요.';

  return {
    koreanName: `${lastName}${row.name}`,
    hanjaName: '인기 이름',
    hanjaChars: [],
    strokeAnalysis: emptyStrokeAnalysis(),
    fiveElements: `${rankWindowLabel} · 현재 데이터 기준 ${row.rank}위`,
    energyInterpretation: keywordMessage,
    score,
  };
}

export async function generateNamingFromPopularDb(
  params: GenerateFromDbParams
): Promise<{ parsed: NamingResult; raw: string }> {
  const normalizedGender = normalizeGender(params.gender);
  const selectedConcepts = parseSelectedConcepts(params.keywords);
  const seed = buildSeed(params);
  const rng = createRng(seed);

  const genderRows = dataset.names
    .filter((row) => row.gender === normalizedGender)
    .sort((a, b) => a.rank - b.rank);

  const rankWindowRows = getRankWindow(genderRows, params.requestIndex);
  const rankWindowLabel = params.requestIndex <= 1 ? '랭킹 1~30 우선 구간' : '랭킹 31+ 확장 구간';

  let candidates = rankWindowRows;
  if (selectedConcepts.length > 0) {
    candidates = [...rankWindowRows].sort((a, b) => {
      const diff = computeCompositeScore(b, selectedConcepts) - computeCompositeScore(a, selectedConcepts);
      if (diff !== 0) return diff;
      return a.rank - b.rank;
    });
    // 컨셉 선택 시 상위 후보군에서 가중 랜덤 추출
    candidates = candidates.slice(0, Math.max(40, Math.min(120, candidates.length)));
  }

  const pickedRows = pickWeightedUnique(
    candidates,
    TOTAL_RECOMMENDATION_COUNT,
    (row) => {
      const rankWeight = 1 + (501 - Math.max(1, Math.min(row.rank, 500))) / 80;
      const conceptWeight = selectedConcepts.length > 0 ? 1 + computeCompositeScore(row, selectedConcepts) / 5 : 1;
      return rankWeight * conceptWeight;
    },
    rng
  );

  const fallbackPool = genderRows.filter((row) => !pickedRows.some((picked) => picked.name === row.name));
  while (pickedRows.length < TOTAL_RECOMMENDATION_COUNT && fallbackPool.length > 0) {
    pickedRows.push(fallbackPool.shift() as PopularNameRow);
  }

  const suggestionsWithMeta = pickedRows.map((row) => ({
    row,
    suggestion: toSuggestion({
      row,
      lastName: params.lastName,
      selectedConcepts,
      rankWindowLabel,
    }),
  }));

  // 화면의 1~N위가 점수와 일치하도록 최종 결과를 점수 내림차순으로 정렬합니다.
  suggestionsWithMeta.sort((a, b) => {
    const scoreDiff = b.suggestion.score - a.suggestion.score;
    if (scoreDiff !== 0) return scoreDiff;
    return a.row.rank - b.row.rank;
  });

  const names = suggestionsWithMeta.map(({ suggestion }) => suggestion);

  const parsed: NamingResult = {
    names,
    philosophy:
      selectedConcepts.length > 0
        ? '추천 기준 : 최근 출생 신고가 많은 DB 에서 선택하신 키워드 점수 반영'
        : '추천 기준 : 최근 출생 신고가 많은 DB 에서 인기 랭킹 기반 랜덤 추천',
    avoidance: '동일 입력으로 재조회하면 추천 풀 구간이 확장되어 새로운 이름 조합을 확인할 수 있습니다.',
    generatedAt: new Date().toISOString(),
  };

  const raw = JSON.stringify({
    source: 'popular-scored-db',
    requestIndex: params.requestIndex,
    selectedConcepts,
    pickedRows,
  });

  return { parsed, raw };
}
