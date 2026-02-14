import OpenAI from 'openai';
import { getSystemPrompt, buildNamingPrompt } from './prompt-builder';
import { parseNamingResponse } from './sections';
import type { NamingResult } from '@/types';
import { HANJA_STROKES, getHanjaStrokeEntry } from '@/lib/hanja/stroke-db';
import {
  type NativeKoreanNameEntry,
  type NativeNameTag,
  NATIVE_KOREAN_NAME_SOURCE,
  pickNativeKoreanNames,
} from '@/lib/korean/native-name-db';

type NameSuggestion = NamingResult['names'][number];

const HANJA_NAME_COUNT = 3;
const NATIVE_NAME_COUNT = 2;

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

function isHanjaChar(char: string): boolean {
  return /^[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]$/.test(char);
}

// DB에서 한자 개별 획수/오행을 보정
function correctHanjaCharsWithDb(name: NameSuggestion): NameSuggestion {
  const updatedChars = name.hanjaChars.map((char) => {
    const dbEntry = getHanjaStrokeEntry(char.character);
    if (dbEntry) {
      return {
        ...char,
        strokes: dbEntry.strokes,
        element: dbEntry.element,
      };
    }
    return char;
  });

  return {
    ...name,
    hanjaChars: updatedChars,
  };
}

function normalizeHanjaOutput(name: NameSuggestion): NameSuggestion {
  const hanjaCharsOnly = name.hanjaChars
    .map((char) => char.character)
    .filter((char) => isHanjaChar(char));
  const joined = hanjaCharsOnly.join('');
  const trimmedHanjaName = name.hanjaName.trim();

  if ((!trimmedHanjaName || trimmedHanjaName === '순우리말') && joined.length >= 2) {
    return {
      ...name,
      hanjaName: joined,
    };
  }

  if (!trimmedHanjaName) {
    return {
      ...name,
      hanjaName: '한자 미제공',
    };
  }

  return name;
}

function stripLastName(fullName: string, lastName: string): string {
  const trimmed = fullName.trim();
  if (trimmed.startsWith(lastName)) {
    return trimmed.slice(lastName.length).trim();
  }
  return trimmed;
}

function ensureFullKoreanName(koreanName: string, lastName: string): string {
  const givenName = stripLastName(koreanName, lastName);
  return `${lastName}${givenName}`;
}

function emptyStrokeAnalysis() {
  return {
    cheongyeok: { value: 0, description: '' },
    ingyeok: { value: 0, description: '' },
    jigyeok: { value: 0, description: '' },
    oegyeok: { value: 0, description: '' },
    chonggyeok: { value: 0, description: '' },
  };
}

function hasBatchim(word: string): boolean {
  if (!word) return false;
  const lastCharCode = word.charCodeAt(word.length - 1);
  if (lastCharCode < 0xac00 || lastCharCode > 0xd7a3) return false;
  return (lastCharCode - 0xac00) % 28 !== 0;
}

function getTopicParticle(word: string): '은' | '는' {
  return hasBatchim(word) ? '은' : '는';
}

function isValidHanjaSuggestion(name: NameSuggestion): boolean {
  const hanjaCharsOnly = name.hanjaChars
    .map((char) => char.character)
    .filter((char) => isHanjaChar(char));

  return hanjaCharsOnly.length >= 2 && name.hanjaName !== '한자 미제공';
}

function createFallbackHanjaSuggestion(lastName: string, offset: number): NameSuggestion {
  const hanjaEntries = Object.entries(HANJA_STROKES);
  const first = hanjaEntries[offset % hanjaEntries.length];
  const second = hanjaEntries[(offset + 37) % hanjaEntries.length];

  const firstChar = first[0];
  const secondChar = second[0];
  const firstEntry = first[1];
  const secondEntry = second[1];
  const givenName = `${firstEntry.reading}${secondEntry.reading}`;

  return {
    koreanName: `${lastName}${givenName}`,
    hanjaName: `${lastName}${firstChar}${secondChar}`,
    hanjaChars: [
      {
        character: firstChar,
        meaning: `${firstEntry.reading} 음의 한자`,
        strokes: firstEntry.strokes,
        element: firstEntry.element,
      },
      {
        character: secondChar,
        meaning: `${secondEntry.reading} 음의 한자`,
        strokes: secondEntry.strokes,
        element: secondEntry.element,
      },
    ],
    strokeAnalysis: emptyStrokeAnalysis(),
    fiveElements: '기본 한자 조합으로 균형 잡힌 구성을 만들었습니다.',
    energyInterpretation: '한자 추천 수량이 부족할 때를 대비한 보정 이름입니다.',
    score: 74,
  };
}

function createNativeSuggestion(
  lastName: string,
  nativeEntry: NativeKoreanNameEntry,
  score: number
): NameSuggestion {
  const particle = getTopicParticle(nativeEntry.name);
  return {
    koreanName: `${lastName}${nativeEntry.name}`,
    hanjaName: '순한글',
    hanjaChars: [
      {
        character: '-',
        meaning: nativeEntry.meaning,
        strokes: 0,
        element: '순한글',
      },
    ],
    strokeAnalysis: emptyStrokeAnalysis(),
    fiveElements: `${nativeEntry.name}${particle} 한자를 쓰지 않고 뜻 중심으로 추천한 순한글 이름입니다.`,
    energyInterpretation: nativeEntry.meaning,
    score,
  };
}

function extractPreferredTags(
  params: { keywords?: string },
  topHanjaName?: NameSuggestion
): NativeNameTag[] {
  const text = [
    params.keywords ?? '',
    topHanjaName?.fiveElements ?? '',
    topHanjaName?.energyInterpretation ?? '',
    topHanjaName?.koreanName ?? '',
  ].join(' ');

  const tagRules: Array<{ pattern: RegExp; tags: NativeNameTag[] }> = [
    { pattern: /강|당당|리더|추진|용기|도전|기백|힘차|우직/, tags: ['강인', '활기'] },
    { pattern: /지혜|총명|슬기|통찰|현명|똑똑|학문/, tags: ['지혜', '차분'] },
    { pattern: /따뜻|온화|배려|포근|사랑|다정|감성/, tags: ['따뜻'] },
    { pattern: /밝|환하|명랑|긍정|빛|반짝/, tags: ['밝음', '희망'] },
    { pattern: /차분|안정|평온|고요|침착/, tags: ['차분'] },
    { pattern: /고급|세련|품격|고귀|우아|기품/, tags: ['고급'] },
    { pattern: /자연|숲|물|바다|하늘|나무|산|바람|강/, tags: ['자연'] },
    { pattern: /맑|깨끗|순수|청아|투명/, tags: ['맑음'] },
    { pattern: /희망|성장|미래|축복|행복|성취/, tags: ['희망'] },
  ];

  const collected: NativeNameTag[] = [];
  for (const rule of tagRules) {
    if (rule.pattern.test(text)) {
      collected.push(...rule.tags);
    }
  }

  const unique = Array.from(new Set(collected));
  if (unique.length > 0) {
    return unique;
  }
  return ['밝음', '따뜻'];
}

function buildSeed(params: {
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
}): string {
  return [
    params.lastName,
    params.gender,
    params.birthYear ?? '',
    params.birthMonth ?? '',
    params.birthDay ?? '',
    params.birthHour ?? '',
    params.birthMinute ?? '',
    params.keywords ?? '',
  ].join('|');
}

function composeFinalSuggestions(
  params: {
    lastName: string;
    gender: string;
    birthYear?: number;
    birthMonth?: number;
    birthDay?: number;
    birthHour?: number;
    birthMinute?: number;
    keywords?: string;
  },
  names: NameSuggestion[]
): NameSuggestion[] {
  const normalized = names
    .map((name) => normalizeHanjaOutput(name))
    .map((name) => correctHanjaCharsWithDb(name));

  const preferredHanja = normalized.filter((name) => isValidHanjaSuggestion(name));
  const orderedHanja = [
    ...preferredHanja,
    ...normalized.filter((name) => !preferredHanja.includes(name)),
  ];

  const selectedHanja: NameSuggestion[] = [];
  const usedGivenNames = new Set<string>();

  for (const candidate of orderedHanja) {
    const givenName = stripLastName(candidate.koreanName, params.lastName);
    if (!givenName || usedGivenNames.has(givenName)) continue;

    selectedHanja.push({
      ...candidate,
      koreanName: ensureFullKoreanName(candidate.koreanName, params.lastName),
    });
    usedGivenNames.add(givenName);

    if (selectedHanja.length >= HANJA_NAME_COUNT) break;
  }

  let fallbackOffset = 0;
  while (selectedHanja.length < HANJA_NAME_COUNT) {
    const fallback = createFallbackHanjaSuggestion(params.lastName, fallbackOffset);
    fallbackOffset += 1;
    const fallbackGivenName = stripLastName(fallback.koreanName, params.lastName);
    if (usedGivenNames.has(fallbackGivenName)) continue;
    selectedHanja.push(fallback);
    usedGivenNames.add(fallbackGivenName);
  }

  const preferredTags = extractPreferredTags(params, selectedHanja[0]);
  const nativeNames = pickNativeKoreanNames({
    count: NATIVE_NAME_COUNT,
    seed: buildSeed(params),
    excludeNames: Array.from(usedGivenNames),
    preferredTags,
    gender: params.gender === 'male' ? 'male' : 'female',
  });

  const nativeSuggestions = nativeNames.map((entry, index) =>
    createNativeSuggestion(params.lastName, entry, 84 - index * 3)
  );

  return [...selectedHanja, ...nativeSuggestions];
}

export async function generateNaming(params: {
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
}): Promise<{
  parsed: NamingResult;
  raw: string;
}> {
  const systemPrompt = getSystemPrompt();
  const userPrompt = buildNamingPrompt(params);

  const response = await getOpenAI().chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    max_tokens: 4000,
    temperature: 0.85,
  });

  const raw = response.choices[0]?.message?.content || '';
  const parsed = parseNamingResponse(raw);
  const mixGuide = `추천 구성: 한자 이름 3개 + 순한글 이름 2개 (${NATIVE_KOREAN_NAME_SOURCE} 기반)`;

  const basePhilosophy = parsed.philosophy?.trim();
  const result: NamingResult = {
    ...parsed,
    names: composeFinalSuggestions(params, parsed.names),
    philosophy: basePhilosophy
      ? `${basePhilosophy}\n\n${mixGuide}`
      : mixGuide,
  };

  return { parsed: result, raw };
}
