import { NamingResult, NameSuggestion, HanjaChar, StrokeAnalysis } from '@/types';

export function parseNamingResponse(raw: string): NamingResult {
  // JSON 블록 추출 (```json ... ``` 또는 { ... })
  let jsonStr = raw;

  const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    // 첫 번째 { 부터 마지막 } 까지 추출
    const firstBrace = raw.indexOf('{');
    const lastBrace = raw.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = raw.slice(firstBrace, lastBrace + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    return validateAndNormalize(parsed);
  } catch {
    // JSON 파싱 실패 시 기본값 반환
    return {
      names: [],
      philosophy: '작명 결과를 처리하는 중 오류가 발생했습니다.',
      avoidance: '',
      generatedAt: new Date().toISOString(),
    };
  }
}

function validateAndNormalize(data: Record<string, unknown>): NamingResult {
  const rawNames = Array.isArray(data.names) ? data.names : [];

  const names: NameSuggestion[] = rawNames.map((n: Record<string, unknown>) => ({
    koreanName: String(n.koreanName || ''),
    hanjaName: String(n.hanjaName || ''),
    hanjaChars: Array.isArray(n.hanjaChars)
      ? n.hanjaChars.map((c: Record<string, unknown>): HanjaChar => ({
          character: String(c.character || ''),
          meaning: String(c.meaning || ''),
          strokes: Number(c.strokes || 0),
          element: String(c.element || ''),
        }))
      : [],
    strokeAnalysis: normalizeStrokeAnalysis(n.strokeAnalysis as Record<string, unknown>),
    fiveElements: String(n.fiveElements || ''),
    energyInterpretation: String(n.energyInterpretation || ''),
    score: Number(n.score || 0),
  }));

  return {
    names: names.sort((a, b) => b.score - a.score),
    philosophy: String(data.philosophy || ''),
    avoidance: String(data.avoidance || ''),
    generatedAt: new Date().toISOString(),
  };
}

function normalizeStrokeAnalysis(data?: Record<string, unknown>): StrokeAnalysis {
  const defaultEntry = { value: 0, description: '' };

  if (!data) {
    return {
      cheongyeok: defaultEntry,
      ingyeok: defaultEntry,
      jigyeok: defaultEntry,
      oegyeok: defaultEntry,
      chonggyeok: defaultEntry,
    };
  }

  const normalize = (entry: unknown) => {
    if (typeof entry === 'object' && entry !== null) {
      const e = entry as Record<string, unknown>;
      return {
        value: Number(e.value || 0),
        description: String(e.description || ''),
      };
    }
    return defaultEntry;
  };

  return {
    cheongyeok: normalize(data.cheongyeok),
    ingyeok: normalize(data.ingyeok),
    jigyeok: normalize(data.jigyeok),
    oegyeok: normalize(data.oegyeok),
    chonggyeok: normalize(data.chonggyeok),
  };
}
