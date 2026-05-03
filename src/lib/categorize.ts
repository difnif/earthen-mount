// 키워드 기반 단순 카테고리 분류 (1단계, 추후 LLM으로 교체 가능)

const RULES: Array<{ cat: string; keywords: string[] }> = [
  {
    cat: '한국 기업',
    keywords: [
      '현대로템', '삼성물산', '한화', 'LG', 'SK', 'KT', '포스코',
      'HD현대', 'KIND', '수출입은행', '한국 기업', '국내 기업',
      'Hyundai Rotem', 'Samsung', 'POSCO',
    ],
  },
  {
    cat: '재건·인프라',
    keywords: [
      '재건', '복구', '인프라', '건설', '전후', '에너지', '주택',
      '철도', '스마트시티', 'PF', '입찰', '재건사업',
      'reconstruction', 'rebuild', 'infrastructure', 'rebuilding',
    ],
  },
  {
    cat: '외교·협상',
    keywords: [
      '젤렌스키', '푸틴', '트럼프', '바이든', '회담', '협상', '종전',
      '휴전', 'NATO', '나토', 'EU', '제재', '평화협상',
      'Zelensky', 'Putin', 'Trump', 'ceasefire', 'sanctions', 'peace talks',
    ],
  },
  {
    cat: '인도주의',
    keywords: [
      '난민', '디아스포라', '피난', '구호', '인도주의', '아동', '실향민',
      'UNHCR', 'refugee', 'humanitarian', 'displaced', 'diaspora',
    ],
  },
];

export function categorize(text: string): string {
  const lower = text.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw.toLowerCase()))) {
      return rule.cat;
    }
  }
  return '일반 보도';
}

export function extractKeywords(text: string): string[] {
  const all = RULES.flatMap((r) => r.keywords);
  const lower = text.toLowerCase();
  // 등장한 키워드만, 중복 제거
  const found = new Set<string>();
  for (const kw of all) {
    if (lower.includes(kw.toLowerCase())) {
      found.add(kw);
    }
  }
  return Array.from(found);
}
