import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // 5분 캐시

const COUNTRY_CODES = ['KR', 'US', 'UK', 'DE', 'UA'];

export async function GET() {
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);

  // 30일치 기사
  const { data: articles, error } = await supabase
    .from('articles')
    .select('id, title, source, country, category, keywords, pub_date, url')
    .gte('pub_date', since30.toISOString())
    .order('pub_date', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ── 시계열: 일자 × 국가 ─────────────────────
  const dayMap: Record<string, Record<string, number>> = {};
  for (const a of articles || []) {
    const day = new Date(a.pub_date).toISOString().slice(0, 10);
    if (!dayMap[day]) {
      dayMap[day] = {};
      for (const c of COUNTRY_CODES) dayMap[day][c] = 0;
    }
    if (COUNTRY_CODES.includes(a.country)) {
      dayMap[day][a.country] = (dayMap[day][a.country] || 0) + 1;
    }
  }
  const timeSeries = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  // ── 이번 주 / 지난 주 ─────────────────────
  const since7 = new Date();
  since7.setDate(since7.getDate() - 7);
  const since14 = new Date();
  since14.setDate(since14.getDate() - 14);

  const thisWeek = (articles || []).filter(
    (a) => new Date(a.pub_date) >= since7
  );
  const prevWeek = (articles || []).filter((a) => {
    const d = new Date(a.pub_date);
    return d >= since14 && d < since7;
  });

  // ── 한국 매체 분포 (이번 주) ──────────────
  const sourceMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};
  const keywordMap: Record<string, number> = {};
  const countryMap: Record<string, number> = {};

  for (const a of thisWeek) {
    if (a.country === 'KR') {
      sourceMap[a.source] = (sourceMap[a.source] || 0) + 1;
    }
    categoryMap[a.category || '일반 보도'] =
      (categoryMap[a.category || '일반 보도'] || 0) + 1;
    countryMap[a.country] = (countryMap[a.country] || 0) + 1;
    for (const kw of a.keywords || []) {
      keywordMap[kw] = (keywordMap[kw] || 0) + 1;
    }
  }

  const sourceDist = Object.entries(sourceMap)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const totalCat = Object.values(categoryMap).reduce((s, n) => s + n, 0) || 1;
  const categories = Object.entries(categoryMap)
    .map(([name, count]) => ({
      name,
      value: Math.round((count / totalCat) * 100),
      count,
    }))
    .sort((a, b) => b.count - a.count);

  const keywords = Object.entries(keywordMap)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const headlines = (articles || []).slice(0, 8).map((a) => ({
    title: a.title,
    source: a.source,
    country: a.country,
    date: new Date(a.pub_date).toISOString().slice(0, 10),
    cat: a.category || '일반',
    url: a.url,
  }));

  return NextResponse.json({
    timeSeries,
    sourceDist,
    categories,
    keywords,
    headlines,
    countryMap,
    weekTotal: thisWeek.length,
    prevWeekTotal: prevWeek.length,
    totalArticles: articles?.length || 0,
    generatedAt: new Date().toISOString(),
  });
}
