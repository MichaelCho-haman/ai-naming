export interface NamingInput {
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
}

export function validateNamingInput(input: NamingInput): string | null {
  if (!input.lastName || input.lastName.trim().length === 0) {
    return '성(姓)을 입력해주세요.';
  }

  if (input.lastName.trim().length > 3) {
    return '성은 3글자 이하로 입력해주세요.';
  }

  if (!input.gender || !['male', 'female'].includes(input.gender)) {
    return '성별을 선택해주세요.';
  }

  if (input.birthYear !== undefined) {
    const maxYear = new Date().getFullYear() + 1;
    if (input.birthYear < 1924 || input.birthYear > maxYear) {
      return `유효한 출생년도를 입력해주세요 (1924-${maxYear}).`;
    }
  }

  if (input.birthMonth !== undefined) {
    if (input.birthMonth < 1 || input.birthMonth > 12) {
      return '유효한 출생 월을 입력해주세요 (1-12).';
    }
  }

  if (input.birthDay !== undefined) {
    if (input.birthDay < 1 || input.birthDay > 31) {
      return '유효한 출생 일을 입력해주세요 (1-31).';
    }

    if (input.birthYear && input.birthMonth) {
      const daysInMonth = new Date(input.birthYear, input.birthMonth, 0).getDate();
      if (input.birthDay > daysInMonth) {
        return `${input.birthMonth}월은 ${daysInMonth}일까지만 있습니다.`;
      }
    }
  }

  if (input.birthHour !== undefined && (input.birthHour < 0 || input.birthHour > 23)) {
    return '유효한 시간을 입력해주세요 (0-23).';
  }

  if (input.birthMinute !== undefined && (input.birthMinute < 0 || input.birthMinute > 59)) {
    return '유효한 분을 입력해주세요 (0-59).';
  }

  return null;
}
