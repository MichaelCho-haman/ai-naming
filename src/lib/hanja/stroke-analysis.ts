import { NameSuggestion, StrokeAnalysis } from '@/types';
import { getHanjaStrokeEntry } from './stroke-db';
import { getSurnameStroke } from './surname-strokes';

const NO_STROKE_ANALYSIS: StrokeAnalysis = {
  cheongyeok: { value: 0, description: '순우리말/한글 이름은 한자 획수 분석 제외' },
  ingyeok: { value: 0, description: '순우리말/한글 이름은 한자 획수 분석 제외' },
  jigyeok: { value: 0, description: '순우리말/한글 이름은 한자 획수 분석 제외' },
  oegyeok: { value: 0, description: '순우리말/한글 이름은 한자 획수 분석 제외' },
  chonggyeok: { value: 0, description: '순우리말/한글 이름은 한자 획수 분석 제외' },
};

function isHangulChar(char: string): boolean {
  return /^[\uAC00-\uD7A3]$/.test(char);
}

function shouldSkipHanjaStrokeAnalysis(name: NameSuggestion): boolean {
  if (name.hanjaName === '순우리말') {
    return true;
  }

  return name.hanjaChars.some((char) => isHangulChar(char.character));
}

function createAnalysis(surnameStroke: number, firstStroke: number, secondStroke: number): StrokeAnalysis {
  const cheongyeok = surnameStroke + 1;
  const ingyeok = surnameStroke + firstStroke;
  const jigyeok = firstStroke + secondStroke;
  const oegyeok = secondStroke + 1;
  const chonggyeok = surnameStroke + firstStroke + secondStroke;

  return {
    cheongyeok: {
      value: cheongyeok,
      description: `성(${surnameStroke})+1=${cheongyeok}`,
    },
    ingyeok: {
      value: ingyeok,
      description: `성(${surnameStroke})+첫째(${firstStroke})=${ingyeok}`,
    },
    jigyeok: {
      value: jigyeok,
      description: `첫째(${firstStroke})+둘째(${secondStroke})=${jigyeok}`,
    },
    oegyeok: {
      value: oegyeok,
      description: `둘째(${secondStroke})+1=${oegyeok}`,
    },
    chonggyeok: {
      value: chonggyeok,
      description: `성(${surnameStroke})+첫째(${firstStroke})+둘째(${secondStroke})=${chonggyeok}`,
    },
  };
}

export function overrideStrokeAnalysisWithDb(lastName: string, name: NameSuggestion): NameSuggestion {
  if (shouldSkipHanjaStrokeAnalysis(name)) {
    return {
      ...name,
      strokeAnalysis: NO_STROKE_ANALYSIS,
    };
  }

  const surnameStroke = getSurnameStroke(lastName);
  if (!surnameStroke || name.hanjaChars.length < 2) {
    return name;
  }

  const updatedChars = name.hanjaChars.map((char) => {
    const dbEntry = getHanjaStrokeEntry(char.character);
    return dbEntry
      ? {
          ...char,
          strokes: dbEntry.strokes,
          element: dbEntry.element,
        }
      : char;
  });

  const first = updatedChars[0];
  const second = updatedChars[1];
  const firstDb = getHanjaStrokeEntry(first?.character || '');
  const secondDb = getHanjaStrokeEntry(second?.character || '');

  if (!firstDb || !secondDb) {
    return {
      ...name,
      hanjaChars: updatedChars,
      strokeAnalysis: {
        cheongyeok: { value: 0, description: '획수 DB 미지원 한자 포함 (분석 보류)' },
        ingyeok: { value: 0, description: '획수 DB 미지원 한자 포함 (분석 보류)' },
        jigyeok: { value: 0, description: '획수 DB 미지원 한자 포함 (분석 보류)' },
        oegyeok: { value: 0, description: '획수 DB 미지원 한자 포함 (분석 보류)' },
        chonggyeok: { value: 0, description: '획수 DB 미지원 한자 포함 (분석 보류)' },
      },
    };
  }

  return {
    ...name,
    hanjaChars: updatedChars,
    strokeAnalysis: createAnalysis(surnameStroke, firstDb.strokes, secondDb.strokes),
  };
}
