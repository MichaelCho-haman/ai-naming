import OpenAI from 'openai';
import { getSystemPrompt, buildNamingPrompt } from './prompt-builder';
import { parseNamingResponse } from './sections';
import type { NamingResult } from '@/types';
import { getHanjaStrokeEntry } from '@/lib/hanja/stroke-db';

type NameSuggestion = NamingResult['names'][number];

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

function normalizeHanjaOutput(name: NameSuggestion, koreanNameOnly: boolean): NameSuggestion {
  if (koreanNameOnly) {
    return name;
  }

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

export async function generateNaming(params: {
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
  koreanNameOnly?: boolean;
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
  const result: NamingResult = {
    ...parsed,
    names: parsed.names
      .map((name) => normalizeHanjaOutput(name, !!params.koreanNameOnly))
      .map((name) => correctHanjaCharsWithDb(name)),
  };

  return { parsed: result, raw };
}
