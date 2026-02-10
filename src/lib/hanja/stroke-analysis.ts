import { NameSuggestion, StrokeAnalysis } from '@/types';
import { getHanjaStrokeEntry } from './stroke-db';
import { getSurnameStroke } from './surname-strokes';

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
  const surnameStroke = getSurnameStroke(lastName);
  if (!surnameStroke || name.hanjaName === '순우리말' || name.hanjaChars.length < 2) {
    return name;
  }

  const updatedChars = name.hanjaChars.map((char) => {
    const dbEntry = getHanjaStrokeEntry(char.character);
    if (!dbEntry) {
      return char;
    }
    return {
      ...char,
      strokes: dbEntry.strokes,
      element: dbEntry.element,
    };
  });

  const first = updatedChars[0];
  const second = updatedChars[1];

  if (!first?.strokes || !second?.strokes) {
    return { ...name, hanjaChars: updatedChars };
  }

  return {
    ...name,
    hanjaChars: updatedChars,
    strokeAnalysis: createAnalysis(surnameStroke, first.strokes, second.strokes),
  };
}
