export const NATIVE_KOREAN_NAME_SOURCE =
  '나무위키 고유어 이름 문서 5.1~5.14 구간';

export type NativeNameTag =
  | '밝음'
  | '차분'
  | '따뜻'
  | '강인'
  | '지혜'
  | '고급'
  | '자연'
  | '희망'
  | '맑음'
  | '활기';

export interface NativeKoreanNameEntry {
  name: string;
  meaning: string;
  tags: NativeNameTag[];
}

export type NativeNameGender = 'male' | 'female';

const FEMALE_LEANING_NATIVE_NAMES = new Set([
  '꽃님',
  '꽃봄',
  '나래',
  '나린',
  '다래',
  '다솜',
  '다소니',
  '다은',
  '단아',
  '달래',
  '도란',
  '보라',
  '보미',
  '봄이',
  '빛나',
  '새라',
  '서린',
  '소담',
  '소라',
  '아라',
  '아리',
  '아림',
  '예리',
  '주리',
  '초롱',
  '티나',
  '하나',
  '해나',
  '해님',
  '혜윰',
  '흰별',
]);

function isEntryAllowedByGender(entry: NativeKoreanNameEntry, gender?: NativeNameGender): boolean {
  if (gender !== 'male') return true;
  return !FEMALE_LEANING_NATIVE_NAMES.has(entry.name);
}

export const NATIVE_KOREAN_NAMES: readonly NativeKoreanNameEntry[] = [
  { name: '가람', meaning: '강을 뜻하는 순한글 이름입니다.', tags: ['자연', '활기'] },
  { name: '가온', meaning: '세상의 중심, 가운데를 뜻합니다.', tags: ['차분', '고급'] },
  { name: '가을', meaning: '풍요와 결실의 계절을 담은 이름입니다.', tags: ['자연', '차분'] },
  { name: '겨울', meaning: '고요하고 단단한 계절의 이미지를 담았습니다.', tags: ['차분', '강인'] },
  { name: '고은', meaning: '곱고 아름답다는 뜻을 담은 이름입니다.', tags: ['고급', '맑음'] },
  { name: '고운', meaning: '맑고 아름다운 모습을 뜻합니다.', tags: ['맑음', '따뜻'] },
  { name: '구름', meaning: '자유롭게 흐르는 구름의 이미지를 담았습니다.', tags: ['자연', '차분'] },
  { name: '그루', meaning: '나무를 세는 단위로, 곧게 자람을 뜻합니다.', tags: ['자연', '강인'] },
  { name: '기쁨', meaning: '삶의 기쁨과 행복을 그대로 담은 이름입니다.', tags: ['밝음', '희망'] },
  { name: '꽃님', meaning: '꽃처럼 사랑스럽고 귀한 사람이라는 뜻입니다.', tags: ['따뜻', '밝음'] },
  { name: '꽃봄', meaning: '꽃피는 봄처럼 화사한 이미지를 담았습니다.', tags: ['밝음', '자연'] },
  { name: '나라', meaning: '큰 세상과 넓은 뜻을 품으라는 의미입니다.', tags: ['희망', '강인'] },
  { name: '나래', meaning: '날개의 옛말로, 높이 비상하라는 뜻입니다.', tags: ['활기', '희망'] },
  { name: '나루', meaning: '물가의 나루터처럼 이어주는 사람이라는 뜻입니다.', tags: ['자연', '따뜻'] },
  { name: '나린', meaning: '하늘이 내린 소중한 존재라는 뜻입니다.', tags: ['고급', '따뜻'] },
  { name: '나림', meaning: '좋은 기운이 내린다는 뜻을 담았습니다.', tags: ['희망', '차분'] },
  { name: '나은', meaning: '더 나은 사람, 더 나은 삶을 뜻합니다.', tags: ['희망', '고급'] },
  { name: '노을', meaning: '해질녘의 따뜻한 빛을 뜻하는 이름입니다.', tags: ['따뜻', '밝음'] },
  { name: '누리', meaning: '세상, 온 세상을 뜻하는 순한글 이름입니다.', tags: ['희망', '강인'] },
  { name: '누림', meaning: '좋은 것을 누리며 살아가라는 뜻입니다.', tags: ['희망', '따뜻'] },
  { name: '눈꽃', meaning: '눈처럼 맑고 꽃처럼 고운 이미지를 담았습니다.', tags: ['맑음', '자연'] },
  { name: '늘봄', meaning: '언제나 봄처럼 따뜻하고 환하라는 뜻입니다.', tags: ['따뜻', '밝음'] },
  { name: '늘빛', meaning: '항상 빛나는 사람이라는 의미를 담았습니다.', tags: ['밝음', '희망'] },
  { name: '늘찬', meaning: '늘 가득 차고 풍성하라는 뜻입니다.', tags: ['강인', '희망'] },
  { name: '다래', meaning: '다래 열매처럼 건강하고 알찬 삶을 뜻합니다.', tags: ['자연', '활기'] },
  { name: '다솜', meaning: '사랑을 뜻하는 옛말에서 온 이름입니다.', tags: ['따뜻', '고급'] },
  { name: '다소니', meaning: '사랑하는 사람이라는 뜻입니다.', tags: ['따뜻', '밝음'] },
  { name: '다온', meaning: '좋은 일이 다 온다는 뜻입니다.', tags: ['희망', '밝음'] },
  { name: '다올', meaning: '좋은 일이 다 올 것이라는 뜻입니다.', tags: ['희망', '활기'] },
  { name: '다은', meaning: '다정하고 은은한 기품을 담은 이름입니다.', tags: ['고급', '따뜻'] },
  { name: '단비', meaning: '가뭄 끝에 내리는 반가운 비를 뜻합니다.', tags: ['희망', '자연'] },
  { name: '단아', meaning: '단정하고 아담한 아름다움을 뜻합니다.', tags: ['고급', '차분'] },
  { name: '달래', meaning: '달래다에서 온 말로, 위로와 따뜻함을 뜻합니다.', tags: ['따뜻', '차분'] },
  { name: '달빛', meaning: '달의 은은한 빛처럼 맑고 고운 이미지를 담았습니다.', tags: ['차분', '맑음'] },
  { name: '도담', meaning: '야무지고 탐스럽게 잘 자란다는 뜻입니다.', tags: ['강인', '희망'] },
  { name: '도란', meaning: '도란도란 정답고 따뜻한 분위기를 뜻합니다.', tags: ['따뜻', '차분'] },
  { name: '도운', meaning: '도움이 되는 사람이라는 의미를 담았습니다.', tags: ['따뜻', '지혜'] },
  { name: '도움', meaning: '다른 이에게 힘이 되는 사람이라는 뜻입니다.', tags: ['따뜻', '희망'] },
  { name: '두루', meaning: '두루두루 넓고 고르게 품는다는 뜻입니다.', tags: ['차분', '지혜'] },
  { name: '두리', meaning: '둘레처럼 넓게 감싸 안는다는 뜻입니다.', tags: ['따뜻', '차분'] },
  { name: '라온', meaning: '즐거운이라는 옛말에서 온 이름입니다.', tags: ['밝음', '활기'] },
  { name: '로다', meaning: '기다리던 존재가 바로 너라는 의미를 담았습니다.', tags: ['희망', '고급'] },
  { name: '로운', meaning: '이롭고 도움이 되는 사람이라는 뜻입니다.', tags: ['지혜', '희망'] },
  { name: '루다', meaning: '이루다에서 온 이름으로 성취를 뜻합니다.', tags: ['강인', '활기'] },
  { name: '루리', meaning: '이루리라는 다짐을 담은 이름입니다.', tags: ['희망', '활기'] },
  { name: '마루', meaning: '정상, 으뜸을 뜻하는 순한글 이름입니다.', tags: ['강인', '고급'] },
  { name: '마음', meaning: '진심과 따뜻한 마음을 담은 이름입니다.', tags: ['따뜻', '차분'] },
  { name: '맑음', meaning: '맑고 깨끗한 기운을 뜻합니다.', tags: ['맑음', '밝음'] },
  { name: '미리내', meaning: '은하수를 뜻하는 순한글 이름입니다.', tags: ['고급', '맑음'] },
  { name: '미르', meaning: '용을 뜻하는 순한글 이름입니다.', tags: ['강인', '고급'] },
  { name: '믿음', meaning: '신뢰와 굳은 마음을 뜻하는 이름입니다.', tags: ['강인', '따뜻'] },
  { name: '바다', meaning: '넓고 깊은 바다의 이미지를 담았습니다.', tags: ['자연', '강인'] },
  { name: '바람', meaning: '자유롭게 흐르는 바람, 또는 소망을 뜻합니다.', tags: ['자연', '활기'] },
  { name: '바름', meaning: '바르고 곧은 삶을 뜻합니다.', tags: ['강인', '지혜'] },
  { name: '반디', meaning: '반딧불처럼 작은 빛을 내는 존재라는 뜻입니다.', tags: ['밝음', '희망'] },
  { name: '벼리', meaning: '큰 줄기, 중심이 되는 원칙을 뜻합니다.', tags: ['지혜', '강인'] },
  { name: '별빛', meaning: '별처럼 맑고 반짝이는 빛을 뜻합니다.', tags: ['밝음', '맑음'] },
  { name: '보담', meaning: '보다 더 낫고 귀하다는 의미입니다.', tags: ['고급', '희망'] },
  { name: '보라', meaning: '보랏빛처럼 고운 색감을 담은 이름입니다.', tags: ['고급', '밝음'] },
  { name: '보람', meaning: '값지고 뜻깊은 결실을 뜻합니다.', tags: ['희망', '지혜'] },
  { name: '보미', meaning: '봄처럼 따뜻하고 아름다운 사람이라는 뜻입니다.', tags: ['따뜻', '밝음'] },
  { name: '봄이', meaning: '봄의 생기와 따뜻함을 담은 이름입니다.', tags: ['밝음', '따뜻'] },
  { name: '봄해', meaning: '봄 햇살처럼 밝고 포근한 기운을 뜻합니다.', tags: ['밝음', '따뜻'] },
  { name: '빛나', meaning: '환하게 빛나는 사람이라는 뜻입니다.', tags: ['밝음', '희망'] },
  { name: '빛가람', meaning: '빛나는 강이라는 뜻의 순한글 이름입니다.', tags: ['밝음', '자연'] },
  { name: '빛내리', meaning: '빛이 내려온 듯한 맑은 이미지를 담았습니다.', tags: ['밝음', '맑음'] },
  { name: '사랑', meaning: '사랑의 마음을 담은 이름입니다.', tags: ['따뜻', '희망'] },
  { name: '산들', meaning: '산들바람처럼 부드럽고 상쾌한 느낌입니다.', tags: ['자연', '차분'] },
  { name: '새결', meaning: '새로운 물결처럼 신선한 시작을 뜻합니다.', tags: ['활기', '희망'] },
  { name: '새길', meaning: '새로운 길을 열어간다는 의미를 담았습니다.', tags: ['강인', '활기'] },
  { name: '새롬', meaning: '새롭고 맑은 기운을 뜻하는 이름입니다.', tags: ['맑음', '희망'] },
  { name: '새론', meaning: '새로운 사람, 새로운 시작을 뜻합니다.', tags: ['활기', '희망'] },
  { name: '샛별', meaning: '새벽하늘에 가장 먼저 빛나는 별을 뜻합니다.', tags: ['밝음', '희망'] },
  { name: '서린', meaning: '이슬이 맺힌 듯 맑고 고운 느낌을 담았습니다.', tags: ['맑음', '차분'] },
  { name: '서림', meaning: '옅게 서려 있는 운치와 깊이를 뜻합니다.', tags: ['차분', '고급'] },
  { name: '세움', meaning: '스스로를 세우고 성장하라는 뜻입니다.', tags: ['강인', '지혜'] },
  { name: '세찬', meaning: '힘차고 강한 기세를 뜻하는 이름입니다.', tags: ['강인', '활기'] },
  { name: '소담', meaning: '아담하고 탐스러운 모습을 뜻합니다.', tags: ['따뜻', '고급'] },
  { name: '소라', meaning: '푸른 바다와 조개를 떠올리게 하는 이름입니다.', tags: ['자연', '맑음'] },
  { name: '소리', meaning: '맑은 울림과 표현력을 담은 이름입니다.', tags: ['활기', '밝음'] },
  { name: '소망', meaning: '희망과 바람을 담은 이름입니다.', tags: ['희망', '따뜻'] },
  { name: '솔비', meaning: '소나무와 비의 맑은 조합을 담았습니다.', tags: ['자연', '맑음'] },
  { name: '솔잎', meaning: '늘 푸른 솔잎처럼 변치 않는 기운을 뜻합니다.', tags: ['자연', '강인'] },
  { name: '슬기', meaning: '총명한 지혜를 뜻하는 이름입니다.', tags: ['지혜', '고급'] },
  { name: '슬비', meaning: '조용히 내리는 비처럼 차분한 기운입니다.', tags: ['차분', '자연'] },
  { name: '아라', meaning: '넓은 바다를 뜻하는 옛말 계열 이름입니다.', tags: ['자연', '고급'] },
  { name: '아람', meaning: '탐스럽게 익은 열매를 뜻합니다.', tags: ['희망', '자연'] },
  { name: '아리', meaning: '아름답고 맑은 느낌을 담은 이름입니다.', tags: ['맑음', '고급'] },
  { name: '아리수', meaning: '한강의 옛 이름으로 맑은 물의 이미지를 담았습니다.', tags: ['자연', '맑음'] },
  { name: '아림', meaning: '맑고 아름다운 울림을 뜻하는 이름입니다.', tags: ['맑음', '고급'] },
  { name: '아진', meaning: '차근차근 앞으로 나아간다는 의미를 담았습니다.', tags: ['강인', '지혜'] },
  { name: '어진', meaning: '어질고 바른 사람을 뜻하는 이름입니다.', tags: ['지혜', '따뜻'] },
  { name: '여울', meaning: '물살이 빠르게 흐르는 여울을 뜻합니다.', tags: ['자연', '활기'] },
  { name: '열매', meaning: '성장 끝의 결실과 풍요를 뜻합니다.', tags: ['희망', '자연'] },
  { name: '윤슬', meaning: '햇빛이나 달빛이 물결에 반짝이는 모습을 뜻합니다.', tags: ['맑음', '고급'] },
  { name: '으뜸', meaning: '가장 뛰어남, 최고를 뜻하는 이름입니다.', tags: ['강인', '고급'] },
  { name: '이룸', meaning: '목표를 이루고 완성한다는 뜻입니다.', tags: ['강인', '희망'] },
  { name: '이든', meaning: '바르고 든든하게 자라라는 뜻입니다.', tags: ['강인', '지혜'] },
  { name: '이레', meaning: '일곱 날, 완성된 주기를 뜻하는 이름입니다.', tags: ['차분', '희망'] },
  { name: '이슬', meaning: '새벽 이슬처럼 맑고 깨끗한 기운입니다.', tags: ['맑음', '차분'] },
  { name: '잎새', meaning: '새잎처럼 생기 있고 섬세한 이미지를 담았습니다.', tags: ['자연', '활기'] },
  { name: '자람', meaning: '건강하게 잘 자라라는 의미를 담았습니다.', tags: ['희망', '강인'] },
  { name: '잔디', meaning: '푸르고 단단한 생명력을 뜻하는 이름입니다.', tags: ['자연', '강인'] },
  { name: '재찬', meaning: '재능이 빛나고 찬란하라는 뜻을 담았습니다.', tags: ['활기', '희망'] },
  { name: '제나', meaning: '언제나 한결같음을 담은 이름입니다.', tags: ['차분', '고급'] },
  { name: '조이', meaning: '기쁨과 즐거움을 담은 이름입니다.', tags: ['밝음', '활기'] },
  { name: '종달', meaning: '종달새처럼 밝고 경쾌한 이미지를 뜻합니다.', tags: ['밝음', '활기'] },
  { name: '주리', meaning: '주변을 두루 살피고 보듬는 의미를 담았습니다.', tags: ['따뜻', '지혜'] },
  { name: '지음', meaning: '의미를 짓고 관계를 잇는다는 뜻입니다.', tags: ['지혜', '차분'] },
  { name: '진솔', meaning: '진실하고 솔직한 마음을 뜻합니다.', tags: ['지혜', '따뜻'] },
  { name: '찬들', meaning: '가득 차고 풍요로운 들판을 떠올리게 합니다.', tags: ['자연', '희망'] },
  { name: '찬솔', meaning: '알차고 곧은 소나무 같은 기운을 뜻합니다.', tags: ['강인', '자연'] },
  { name: '초롱', meaning: '맑게 반짝이는 빛을 뜻하는 이름입니다.', tags: ['밝음', '맑음'] },
  { name: '큰별', meaning: '크게 빛나는 별처럼 자라라는 뜻입니다.', tags: ['희망', '밝음'] },
  { name: '큰길', meaning: '큰 뜻으로 바른 길을 가라는 의미입니다.', tags: ['강인', '지혜'] },
  { name: '키움', meaning: '성장과 발전을 돕는다는 의미를 담았습니다.', tags: ['희망', '활기'] },
  { name: '토리', meaning: '도토리에서 온 이름으로 단단한 성장을 뜻합니다.', tags: ['자연', '강인'] },
  { name: '파랑', meaning: '맑고 시원한 파란빛의 이미지를 담았습니다.', tags: ['맑음', '활기'] },
  { name: '파란', meaning: '푸르고 생동하는 기운을 뜻합니다.', tags: ['맑음', '활기'] },
  { name: '포근', meaning: '따뜻하고 편안한 감정을 담은 이름입니다.', tags: ['따뜻', '차분'] },
  { name: '푸르내', meaning: '푸른 시냇물처럼 맑고 힘찬 이미지를 담았습니다.', tags: ['자연', '활기'] },
  { name: '푸른', meaning: '푸르고 싱그러운 생명력을 뜻합니다.', tags: ['자연', '활기'] },
  { name: '푸름', meaning: '짙은 푸른빛처럼 깊고 맑은 느낌입니다.', tags: ['맑음', '차분'] },
  { name: '푸르미', meaning: '푸르름을 의인화한 이름으로 생기를 뜻합니다.', tags: ['자연', '활기'] },
  { name: '풀잎', meaning: '작지만 강한 생명력을 가진 풀잎을 뜻합니다.', tags: ['자연', '강인'] },
  { name: '피리', meaning: '맑은 소리의 악기처럼 고운 울림을 뜻합니다.', tags: ['맑음', '활기'] },
  { name: '하나', meaning: '세상에 하나뿐인 소중함을 뜻합니다.', tags: ['고급', '따뜻'] },
  { name: '하늘', meaning: '크고 넓은 하늘처럼 큰 사람을 뜻합니다.', tags: ['자연', '희망'] },
  { name: '하늬', meaning: '서쪽에서 부는 바람을 뜻하는 순한글 이름입니다.', tags: ['자연', '차분'] },
  { name: '하루', meaning: '매일 새롭게 빛나라는 의미를 담았습니다.', tags: ['밝음', '희망'] },
  { name: '하람', meaning: '하늘이 내린 소중한 사람이라는 뜻입니다.', tags: ['고급', '따뜻'] },
  { name: '하리', meaning: '반드시 이루겠다는 다짐의 뜻을 담았습니다.', tags: ['강인', '활기'] },
  { name: '한결', meaning: '처음과 끝이 한결같은 사람을 뜻합니다.', tags: ['차분', '지혜'] },
  { name: '한길', meaning: '한 길을 곧게 가는 우직함을 뜻합니다.', tags: ['강인', '지혜'] },
  { name: '한빛', meaning: '크고 밝은 빛을 뜻하는 이름입니다.', tags: ['밝음', '희망'] },
  { name: '한솔', meaning: '큰 소나무처럼 곧고 푸르게 자라라는 뜻입니다.', tags: ['강인', '자연'] },
  { name: '한얼', meaning: '큰 뜻과 넓은 정신을 담은 이름입니다.', tags: ['고급', '지혜'] },
  { name: '한울', meaning: '큰 하늘, 큰 우주를 뜻하는 이름입니다.', tags: ['자연', '희망'] },
  { name: '해나', meaning: '해처럼 밝게 자라라는 뜻을 담았습니다.', tags: ['밝음', '희망'] },
  { name: '해님', meaning: '태양처럼 따뜻하고 환한 존재를 뜻합니다.', tags: ['밝음', '따뜻'] },
  { name: '해봄', meaning: '햇살과 봄의 따뜻함을 함께 담은 이름입니다.', tags: ['따뜻', '밝음'] },
  { name: '해솔', meaning: '해와 소나무의 밝고 곧은 이미지를 담았습니다.', tags: ['밝음', '강인'] },
  { name: '햇살', meaning: '햇빛처럼 포근하고 밝은 기운을 뜻합니다.', tags: ['밝음', '따뜻'] },
  { name: '혜윰', meaning: '생각을 깊이 헤아림을 뜻하는 순한글 이름입니다.', tags: ['지혜', '차분'] },
  { name: '흰가람', meaning: '맑고 깨끗한 강의 이미지를 담은 이름입니다.', tags: ['맑음', '자연'] },
  { name: '흰별', meaning: '맑게 빛나는 흰 별의 이미지를 담았습니다.', tags: ['맑음', '밝음'] },
  { name: '흰샘', meaning: '맑은 샘물처럼 깨끗한 기운을 뜻합니다.', tags: ['맑음', '차분'] },
];

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function pickNativeKoreanNames(params: {
  count: number;
  seed: string;
  excludeNames?: string[];
  preferredTags?: NativeNameTag[];
  gender?: NativeNameGender;
}): NativeKoreanNameEntry[] {
  const { count, seed, excludeNames = [], preferredTags = [], gender } = params;
  const excludes = new Set(excludeNames);
  const preferred = new Set(preferredTags);

  const allPool = NATIVE_KOREAN_NAMES.filter((entry) => !excludes.has(entry.name));
  if (count <= 0 || allPool.length === 0) {
    return [];
  }

  const genderPool = allPool.filter((entry) => isEntryAllowedByGender(entry, gender));
  const pool = genderPool.length >= count ? genderPool : allPool;

  const seeded = pool
    .map((entry, index) => {
      const tagScore = entry.tags.reduce((acc, tag) => (preferred.has(tag) ? acc + 1 : acc), 0);
      const randomScore = hashString(`${seed}|${entry.name}|${index}`) % 1000;
      return {
        entry,
        tagScore,
        randomScore,
      };
    })
    .sort((a, b) => {
      if (b.tagScore !== a.tagScore) return b.tagScore - a.tagScore;
      return b.randomScore - a.randomScore;
    });

  return seeded.slice(0, count).map((item) => item.entry);
}
