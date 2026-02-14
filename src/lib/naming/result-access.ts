import { NamingResult } from '@/types';

export function maskLockedNames(result: NamingResult, shouldLock: boolean): NamingResult {
  if (!shouldLock) return result;

  return {
    ...result,
    names: result.names.map((name, index) => {
      if (index === 0) return name;
      return {
        ...name,
        koreanName: '결제 후 공개',
        hanjaName: '결제 후 공개',
        hanjaChars: [],
        fiveElements: '결제 후 확인할 수 있어요',
        energyInterpretation: '결제 후 확인할 수 있어요',
        score: 0,
      };
    }),
  };
}
