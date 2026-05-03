import crypto from 'crypto';

export interface NaverItem {
  title: string;
  originallink: string;
  link: string;
  description: string;
  pubDate: string;
}

interface NaverResponse {
  items: NaverItem[];
  total: number;
}

export async function searchNaverNews(
  query: string,
  display = 100
): Promise<NaverItem[]> {
  const url = `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(
    query
  )}&display=${display}&sort=date`;

  const res = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID!,
      'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET!,
    },
  });

  if (!res.ok) {
    throw new Error(`Naver API ${res.status}: ${await res.text()}`);
  }

  const data: NaverResponse = await res.json();
  return data.items;
}

// HTML entity & tag 제거
export function cleanText(s: string): string {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}

// URL 기반 안정적 ID 생성 (중복 방지)
export function makeId(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').slice(0, 16);
}

// 매체명 추출 (originallink 도메인 → 매체명 매핑)
const SOURCE_MAP: Record<string, string> = {
  'yna.co.kr': '연합뉴스',
  'chosun.com': '조선일보',
  'joongang.co.kr': '중앙일보',
  'donga.com': '동아일보',
  'hani.co.kr': '한겨레',
  'khan.co.kr': '경향신문',
  'hankyung.com': '한국경제',
  'mk.co.kr': '매일경제',
  'kbs.co.kr': 'KBS',
  'mbc.co.kr': 'MBC',
  'sbs.co.kr': 'SBS',
  'jtbc.co.kr': 'JTBC',
  'ytn.co.kr': 'YTN',
  'hankookilbo.com': '한국일보',
  'segye.com': '세계일보',
  'munhwa.com': '문화일보',
  'asiae.co.kr': '아시아경제',
  'edaily.co.kr': '이데일리',
  'mt.co.kr': '머니투데이',
  'newsis.com': '뉴시스',
  'news1.kr': '뉴스1',
};

export function extractSource(originallink: string): string {
  try {
    const host = new URL(originallink).hostname.replace(/^www\./, '');
    for (const [domain, name] of Object.entries(SOURCE_MAP)) {
      if (host.includes(domain)) return name;
    }
    return host;
  } catch {
    return 'unknown';
  }
}
