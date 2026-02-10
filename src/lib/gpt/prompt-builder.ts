export function getSystemPrompt(): string {
  return `당신은 30년 경력의 작명 전문가이면서 MZ세대와 소통할 줄 아는 현대적 작명사입니다.
전통적인 한국 작명법(음양오행, 획수, 한자 의미)에 깊은 지식을 가지고 있으면서도,
현대적이고 세련된 이름을 추천할 줄 아는 전문가입니다.

당신의 작명 원칙:
1. 음양오행의 조화 — 이름의 획수와 한자가 사주와 조화를 이루어야 합니다
2. 획수 분석 — 천격, 인격, 지격, 외격, 총격이 모두 길한 수여야 합니다
3. 한자 의미 — 좋은 뜻의 한자를 사용하되, 너무 흔하지 않은 조합을 추천합니다
4. 발음의 미학 — 부르기 좋고, 듣기 좋은 이름이어야 합니다
5. 시대성 — 현대 사회에서 자연스럽고 세련된 이름이어야 합니다
6. 다양성 — 5개의 이름이 서로 완전히 다른 느낌과 스타일이어야 합니다. 비슷한 발음, 같은 글자를 공유하는 이름은 절대 피하세요.

반드시 아래 JSON 형식으로 응답하세요. 다른 텍스트는 포함하지 마세요.`;
}

export function buildNamingPrompt(params: {
  lastName: string;
  gender: string;
  birthYear?: number;
  birthMonth?: number;
  birthDay?: number;
  birthHour?: number;
  birthMinute?: number;
  keywords?: string;
  koreanNameOnly?: boolean;
}): string {
  const genderText = params.gender === 'male' ? '남자' : '여자';

  let birthInfo = '';
  if (params.birthYear && params.birthMonth && params.birthDay) {
    birthInfo = `생년월일: ${params.birthYear}년 ${params.birthMonth}월 ${params.birthDay}일`;
    if (params.birthHour !== undefined && params.birthMinute !== undefined) {
      birthInfo += ` ${params.birthHour}시 ${params.birthMinute}분`;
    }
  }

  const keywordsInfo = params.keywords ? `원하는 느낌/키워드: ${params.keywords}` : '';

  const koreanNameInstruction = params.koreanNameOnly
    ? `\n\n★ 중요: 한글 이름(순우리말 이름)으로 작명해주세요.
- 한자가 아닌 순우리말로 된 이름을 추천하세요 (예: 하늘, 나래, 아름, 다온, 새봄, 이슬, 가온, 한결 등)
- hanjaName에는 "순우리말"이라고 표기하세요
- hanjaChars에는 각 글자의 우리말 뜻풀이를 넣으세요 (character에 한글 글자, meaning에 뜻, element에 연관 오행)
- 흔한 순우리말 이름(하늘, 나래 등)보다 독특하고 예쁜 우리말 이름을 우선 추천하세요`
    : '';

  return `다음 조건으로 이름 5개를 추천해주세요:

성(姓): ${params.lastName}
성별: ${genderText}
${birthInfo}
${keywordsInfo}${koreanNameInstruction}

★ 다양성 필수 조건:
- 5개 이름이 서로 완전히 다른 글자, 다른 발음, 다른 느낌이어야 합니다
- 같은 글자를 두 개 이상의 이름에서 공유하지 마세요 (예: 서윤, 서연처럼 '서'가 반복되면 안 됨)
- 흔한 인기 이름(서윤, 서연, 지우, 하준, 시우 등)은 최대 1개만 포함하세요
- 나머지는 독창적이면서도 자연스러운 이름을 추천하세요
- 각 이름의 첫 글자가 모두 달라야 합니다

반드시 아래 JSON 형식으로만 응답하세요:

{
  "names": [
    {
      "koreanName": "홍길동",
      "hanjaName": "洪吉東",
      "hanjaChars": [
        { "character": "吉", "meaning": "길할 길 - 좋은 운과 행복을 상징", "strokes": 6, "element": "목(木)" },
        { "character": "東", "meaning": "동녘 동 - 새로운 시작과 희망을 의미", "strokes": 8, "element": "목(木)" }
      ],
      "strokeAnalysis": {
        "cheongyeok": { "value": 0, "description": "천격 설명" },
        "ingyeok": { "value": 0, "description": "인격 설명" },
        "jigyeok": { "value": 0, "description": "지격 설명" },
        "oegyeok": { "value": 0, "description": "외격 설명" },
        "chonggyeok": { "value": 0, "description": "총격 설명" }
      },
      "fiveElements": "목-목 조합으로 성장과 발전의 기운이 강함",
      "energyInterpretation": "이 이름이 가진 에너지와 느낌에 대한 해석",
      "score": 92
    }
  ],
  "philosophy": "왜 이 이름들을 추천했는지에 대한 작명 철학 설명",
  "avoidance": "피해야 할 한자나 조합에 대한 안내"
}

주의사항:
- 성(姓)의 획수를 정확히 계산하여 천격에 반영하세요
- 이름 글자는 2글자 이름을 기본으로 하세요 (성 1자 + 이름 2자)
- hanjaChars에는 이름 부분의 한자만 포함하세요 (성 제외)
- 각 이름의 점수는 70~98 사이로 차등을 두세요
- 점수가 높은 순서대로 정렬하세요
- 실제 존재하는 한자를 사용하고, 획수를 정확하게 계산하세요
- 5개 이름의 첫 글자(이름 부분)가 모두 달라야 합니다
- 반드시 유효한 JSON만 출력하세요`;
}
