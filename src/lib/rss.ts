import Parser from 'rss-parser';
import crypto from 'crypto';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (compatible; EarthenMount/1.0; +https://earthen-mount.vercel.app)',
  },
});

export interface RssSource {
  name: string;       // 매체명 (예: 'Reuters')
  country: string;    // 국가 코드 (US, UK, DE, JP)
  url: string;        // RSS URL
  filterKeywords?: string[]; // 이 키워드 중 하나라도 포함된 기사만 수집
}

// Tier 2: 우크라이나 보도 가능성 높은 영문/다국어 RSS
export const RSS_SOURCES: RssSource[] = [
  {
    name: 'Reuters World',
    country: 'US',
    url: 'https://feeds.reuters.com/Reuters/worldNews',
    filterKeywords: ['ukraine', 'kyiv', 'zelensky', 'russia'],
  },
  {
    name: 'BBC World',
    country: 'UK',
    url: 'http://feeds.bbci.co.uk/news/world/rss.xml',
    filterKeywords: ['ukraine', 'kyiv', 'zelensky', 'russia'],
  },
  {
    name: 'The Guardian Ukraine',
    country: 'UK',
    url: 'https://www.theguardian.com/world/ukraine/rss',
    // Ukraine 전용 피드 — 필터 불필요
  },
  {
    name: 'Deutsche Welle',
    country: 'DE',
    url: 'https://rss.dw.com/rdf/rss-en-all',
    filterKeywords: ['ukraine', 'kyiv', 'zelensky', 'russia'],
  },
  {
    name: 'Kyiv Independent',
    country: 'UA',
    url: 'https://kyivindependent.com/rss/',
    // 우크라이나 매체 — 전부 관련됨
  },
];

export interface RssItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  source: string;
  country: string;
}

export async function fetchRssSource(src: RssSource): Promise<RssItem[]> {
  try {
    const feed = await parser.parseURL(src.url);
    const items: RssItem[] = [];

    for (const item of feed.items) {
      const title = (item.title || '').trim();
      const desc = (item.contentSnippet || item.content || item.summary || '').trim();
      const link = item.link || item.guid || '';
      if (!title || !link) continue;

      // 키워드 필터 (있는 경우만)
      if (src.filterKeywords) {
        const text = `${title} ${desc}`.toLowerCase();
        const matched = src.filterKeywords.some((kw) =>
          text.includes(kw.toLowerCase())
        );
        if (!matched) continue;
      }

      const pubDate = item.isoDate
        ? new Date(item.isoDate)
        : item.pubDate
        ? new Date(item.pubDate)
        : new Date();

      const id = crypto
        .createHash('sha256')
        .update(link)
        .digest('hex')
        .slice(0, 16);

      items.push({
        id,
        title,
        description: desc.slice(0, 500),
        link,
        pubDate,
        source: src.name,
        country: src.country,
      });
    }

    return items;
  } catch (e) {
    console.error(`RSS fetch failed: ${src.name}`, (e as Error).message);
    return [];
  }
}
