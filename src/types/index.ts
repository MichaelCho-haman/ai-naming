export interface NamingInput {
  lastName: string;
  gender: 'male' | 'female';
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
}

export interface HanjaChar {
  character: string;
  meaning: string;
  strokes: number;
  element: string;
}

export interface StrokeAnalysis {
  cheongyeok: { value: number; description: string };
  ingyeok: { value: number; description: string };
  jigyeok: { value: number; description: string };
  oegyeok: { value: number; description: string };
  chonggyeok: { value: number; description: string };
}

export interface NameSuggestion {
  koreanName: string;
  hanjaName: string;
  hanjaChars: HanjaChar[];
  strokeAnalysis: StrokeAnalysis;
  fiveElements: string;
  energyInterpretation: string;
  score: number;
}

export interface NamingResult {
  names: NameSuggestion[];
  philosophy: string;
  avoidance: string;
  generatedAt: string;
}

export interface Naming {
  id: string;
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
  namingContent: NamingResult | null;
  namingRaw: string | null;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
  createdAt: string;
  viewCount: number;
  sharedCount: number;
}
