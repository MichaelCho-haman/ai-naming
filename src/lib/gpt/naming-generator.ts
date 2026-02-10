import OpenAI from 'openai';
import { getSystemPrompt, buildNamingPrompt } from './prompt-builder';
import { parseNamingResponse } from './sections';
import { NamingResult } from '@/types';

let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
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

  return { parsed, raw };
}
