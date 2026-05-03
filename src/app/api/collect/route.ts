import { NextRequest, NextResponse } from 'next/server';
import {
  searchNaverNews,
  cleanText,
  makeId,
  extractSource,
} from '@/lib/naver';
import { categorize, extractKeywords } from '@/lib/categorize';
import { RSS_SOURCES, fetchRssSource } from '@/lib/rss';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const NAVER_QUERIES = [
  '우크라이나',
  '우크라이나 재건',
  '젤렌스키',
  '러시아 우크라이나',
  '키이우',
];

export async function GET(req: NextRequest) {
  // 보안: cron secret 확인
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const sb = supabaseAdmin();

  // 수집 로그 시작
  const { data: runRow } = await sb
    .from('collection_runs')
    .insert({ status: 'running' })
    .select()
    .single();

  let added = 0;
  let skipped = 0;
  const errors: string[] = [];

  try {
    // ─── Tier 1: Naver (한국 매체) ─────────────────────────
    for (const query of NAVER_QUERIES) {
      try {
        const items = await searchNaverNews(query, 100);

        for (const item of items) {
          const url = item.originallink || item.link;
          const id = makeId(url);
          const title = cleanText(item.title);
          const description = cleanText(item.description);
          const source = extractSource(url);
          const text = `${title} ${description}`;
          const category = categorize(text);
          const keywords = extractKeywords(text);

          const { error } = await sb.from('articles').upsert(
            {
              id,
              title,
              description,
              source,
              country: 'KR',
              url: item.link,
              original_link: url,
              pub_date: new Date(item.pubDate).toISOString(),
              category,
              keywords,
              raw_query: query,
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );

          if (error) skipped++;
          else added++;
        }

        // 네이버 API 호출 간격
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        errors.push(`naver:${query}: ${(e as Error).message}`);
      }
    }

    // ─── Tier 2: RSS (영문/다국어 매체) ──────────────────
    for (const src of RSS_SOURCES) {
      try {
        const items = await fetchRssSource(src);

        for (const item of items) {
          const text = `${item.title} ${item.description}`;
          const category = categorize(text);
          const keywords = extractKeywords(text);

          const { error } = await sb.from('articles').upsert(
            {
              id: item.id,
              title: item.title,
              description: item.description,
              source: item.source,
              country: item.country,
              url: item.link,
              original_link: item.link,
              pub_date: item.pubDate.toISOString(),
              category,
              keywords,
              raw_query: 'rss',
            },
            { onConflict: 'id', ignoreDuplicates: true }
          );

          if (error) skipped++;
          else added++;
        }
      } catch (e) {
        errors.push(`rss:${src.name}: ${(e as Error).message}`);
      }
    }

    // 로그 마감
    await sb
      .from('collection_runs')
      .update({
        completed_at: new Date().toISOString(),
        articles_added: added,
        articles_skipped: skipped,
        status: errors.length ? 'partial' : 'completed',
        error: errors.length ? errors.join('; ') : null,
      })
      .eq('id', runRow!.id);

    return NextResponse.json({
      ok: true,
      added,
      skipped,
      errors,
    });
  } catch (e) {
    await sb
      .from('collection_runs')
      .update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error: (e as Error).message,
      })
      .eq('id', runRow!.id);

    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
