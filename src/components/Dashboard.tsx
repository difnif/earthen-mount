'use client';

import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

const COUNTRIES = [
  { code: 'KR', label: '대한민국', labelEn: 'Republic of Korea', color: '#7d3c3c' },
  { code: 'US', label: '미국', labelEn: 'United States', color: '#3c5a7d' },
  { code: 'UK', label: '영국', labelEn: 'United Kingdom', color: '#5a4a7d' },
  { code: 'DE', label: '독일', labelEn: 'Germany', color: '#3c6b4a' },
  { code: 'UA', label: '우크라이나', labelEn: 'Ukraine', color: '#8b6a3c' },
];

const fmt = (n: number) => n.toLocaleString('ko-KR');

interface TimeSeriesPoint {
  date: string;
  KR?: number;
  US?: number;
  UK?: number;
  DE?: number;
  UA?: number;
}

interface DashboardData {
  timeSeries: TimeSeriesPoint[];
  sourceDist: Array<{ source: string; count: number }>;
  categories: Array<{ name: string; value: number; count: number }>;
  keywords: Array<{ word: string; count: number }>;
  headlines: Array<{
    title: string;
    source: string;
    country: string;
    date: string;
    cat: string;
    url: string;
  }>;
  countryMap: Record<string, number>;
  weekTotal: number;
  prevWeekTotal: number;
  totalArticles: number;
  generatedAt: string;
}

export function Dashboard({ data }: { data: DashboardData | null }) {
  const [active, setActive] = useState<string[]>(['KR', 'US', 'UK', 'DE', 'UA']);

  if (!data || data.totalArticles === 0) {
    return (
      <>
        <FontStyles />
        <div
          className="min-h-screen flex items-center justify-center font-body"
          style={{ backgroundColor: '#f5f0e6', color: '#2a2418' }}
        >
          <div className="text-center px-8">
            <div className="font-display text-4xl italic mb-4">
              아직 자료가 충분하지 않습니다
            </div>
            <div className="font-body text-[#5a4f3e] italic text-lg">
              수집이 누적되면 다시 방문해주십시오.
            </div>
            <div className="font-mono text-[10px] text-[#8a7d6e] mt-8 tracking-widest uppercase">
              Earthen Mount · 자료 수집 중
            </div>
          </div>
        </div>
      </>
    );
  }

  const change =
    data.prevWeekTotal > 0
      ? (((data.weekTotal - data.prevWeekTotal) / data.prevWeekTotal) * 100).toFixed(1)
      : '0';

  const maxKw = data.keywords[0]?.count || 1;
  const maxSrc = data.sourceDist[0]?.count || 1;

  const toggleCountry = (code: string) =>
    setActive((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );

  return (
    <>
      <FontStyles />
      <div
        className="min-h-screen font-body"
        style={{
          backgroundColor: '#f5f0e6',
          color: '#2a2418',
          backgroundImage:
            'radial-gradient(ellipse at top, rgba(120,100,70,0.04), transparent 60%)',
        }}
      >
        {/* metadata strip */}
        <div
          className="border-b font-mono text-[10px] tracking-widest uppercase"
          style={{ borderColor: '#d8cfb8', color: '#8a7d6e' }}
        >
          <div className="max-w-6xl mx-auto px-8 py-3 flex items-center justify-between flex-wrap gap-3">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7d3c3c] pulse-soft" />
              Earthen Mount · Vol. I
            </span>
            <span>
              Last update · {new Date(data.generatedAt).toLocaleString('ko-KR')}
            </span>
          </div>
        </div>

        {/* masthead */}
        <header className="max-w-6xl mx-auto px-8 pt-16 pb-12 text-center">
          <div className="font-mono text-[11px] tracking-[0.4em] uppercase text-[#8a7d6e] mb-6">
            An Observatory of the Ukrainian Question
          </div>
          <h1 className="font-display text-6xl md:text-7xl leading-[1.05] mb-4 text-[#1a1612]">
            <span className="italic">Earthen</span>
            <span className="text-[#7d3c3c]"> · </span>
            <span>Mount</span>
          </h1>
          <div className="font-display italic text-xl text-[#5a4f3e] mt-6 max-w-2xl mx-auto leading-relaxed">
            &ldquo;토산은 어느 쪽으로 무너질지 모른다.
            <br />
            기록은 가장 조용한 형태의 응시이다.&rdquo;
          </div>
          <div
            className="w-16 h-px mx-auto mt-8"
            style={{ backgroundColor: '#7d3c3c' }}
          />
        </header>

        {/* stat ledger */}
        <section
          className="max-w-6xl mx-auto px-8 py-12 border-y"
          style={{ borderColor: '#d8cfb8' }}
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              {
                label: 'This Week',
                value: fmt(data.weekTotal),
                sub: `전주 대비 ${Number(change) > 0 ? '+' : ''}${change}%`,
              },
              {
                label: 'Cumulative',
                value: fmt(data.totalArticles),
                sub: '30일 보존',
              },
              {
                label: 'Sources',
                value: String(data.sourceDist.length),
                sub: '한국 매체',
              },
              {
                label: 'Countries',
                value: String(Object.keys(data.countryMap).length),
                sub: '관측 국가',
              },
            ].map((s, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#8a7d6e] mb-3">
                  {s.label}
                </div>
                <div className="font-display text-5xl text-[#1a1612] leading-none mb-2">
                  {s.value}
                </div>
                <div className="font-body italic text-sm text-[#5a4f3e]">
                  {s.sub}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* time series */}
        <section className="max-w-6xl mx-auto px-8 py-16">
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-12 md:col-span-3">
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#7d3c3c] mb-3">
                Figure I
              </div>
              <h2 className="font-display text-3xl text-[#1a1612] leading-tight mb-4">
                다국가 보도량의 시간적 추이
              </h2>
              <p className="font-body italic text-[#5a4f3e] leading-relaxed">
                각국 매체가 같은 사건을 어떻게 다른 무게로 다루는가. 지난 30일간의
                일별 보도량은 의제 형성의 비대칭성을 드러낸다.
              </p>
              <div
                className="w-12 h-px mt-6 mb-6"
                style={{ backgroundColor: '#7d3c3c' }}
              />
              <div className="space-y-2">
                {COUNTRIES.map((c) => {
                  const on = active.includes(c.code);
                  return (
                    <button
                      key={c.code}
                      onClick={() => toggleCountry(c.code)}
                      className="flex items-center gap-3 w-full text-left transition-opacity"
                      style={{ opacity: on ? 1 : 0.35 }}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{
                          backgroundColor: c.color,
                          boxShadow: on
                            ? `0 0 0 1px ${c.color}, 0 0 0 4px ${c.color}20`
                            : 'none',
                        }}
                      />
                      <div className="flex-1">
                        <div className="text-base text-[#1a1612]">{c.label}</div>
                        <div className="font-mono text-[9px] uppercase tracking-wider text-[#8a7d6e]">
                          {c.labelEn}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="col-span-12 md:col-span-9">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={data.timeSeries}
                    margin={{ top: 10, right: 10, bottom: 10, left: -20 }}
                  >
                    <CartesianGrid
                      stroke="#d8cfb8"
                      strokeDasharray="2 4"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      stroke="#c4b89e"
                      tickLine={false}
                      interval={4}
                    />
                    <YAxis stroke="#c4b89e" tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#f5f0e6',
                        border: '1px solid #2a2418',
                        borderRadius: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: '11px',
                        padding: '8px 12px',
                      }}
                      labelStyle={{
                        color: '#7d3c3c',
                        fontFamily: "'EB Garamond', serif",
                        fontSize: '13px',
                        fontStyle: 'italic',
                      }}
                    />
                    {COUNTRIES.map(
                      (c) =>
                        active.includes(c.code) && (
                          <Line
                            key={c.code}
                            type="monotone"
                            dataKey={c.code}
                            stroke={c.color}
                            strokeWidth={1.25}
                            dot={false}
                            activeDot={{ r: 3, strokeWidth: 0 }}
                          />
                        )
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="font-mono text-[10px] text-[#8a7d6e] mt-4 italic">
                Fig. I — 일별 보도 건수. 자료: 네이버 뉴스 API (한국), 각 매체 RSS (해외).
                메타데이터만 수집.
              </p>
            </div>
          </div>
        </section>

        {/* categories */}
        <section
          className="max-w-6xl mx-auto px-8 py-16 border-t"
          style={{ borderColor: '#d8cfb8' }}
        >
          <div className="grid grid-cols-12 gap-12">
            <div className="col-span-12 md:col-span-9 order-2 md:order-1">
              <div className="space-y-7">
                {data.categories.map((cat, i) => (
                  <div key={cat.name}>
                    <div className="flex items-baseline justify-between mb-2 gap-4">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-[10px] text-[#8a7d6e] tabular-nums">
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        <span className="font-display text-2xl text-[#1a1612]">
                          {cat.name}
                        </span>
                      </div>
                      <span className="font-mono text-sm text-[#7d3c3c] tabular-nums">
                        {cat.value}%
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 50 }).map((_, idx) => (
                        <div
                          key={idx}
                          className="flex-1"
                          style={{
                            height: '2px',
                            backgroundColor:
                              idx < Math.round(cat.value / 2)
                                ? '#7d3c3c'
                                : '#d8cfb8',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-12 md:col-span-3 order-1 md:order-2">
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#7d3c3c] mb-3">
                Figure II
              </div>
              <h2 className="font-display text-3xl text-[#1a1612] leading-tight mb-4">
                의제의 구성
              </h2>
              <p className="font-body italic text-[#5a4f3e] leading-relaxed">
                무엇이 자주 다루어지는가는 한 사회가 무엇을 중요하게 여기는지에 대한
                무언의 진술이다.
              </p>
            </div>
          </div>
        </section>

        {/* headlines */}
        <section
          className="max-w-6xl mx-auto px-8 py-16 border-t"
          style={{ borderColor: '#d8cfb8' }}
        >
          <div className="mb-10">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#7d3c3c] mb-3">
              Section III · 헤드라인 색인
            </div>
            <h2 className="font-display text-4xl text-[#1a1612] leading-tight">
              최근 항목들
            </h2>
            <p className="font-body italic text-[#5a4f3e] mt-3 max-w-2xl">
              제목과 출처만을 색인한다. 본문은 원전(原典)에서 읽는다.
            </p>
          </div>
          <div className="border-t" style={{ borderColor: '#2a2418' }}>
            {data.headlines.map((h, i) => (
              <a
                key={i}
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="grid grid-cols-12 gap-6 py-6 border-b transition-colors hover:bg-[#ede5d2] -mx-4 px-4 group"
                style={{ borderColor: '#d8cfb8' }}
              >
                <div className="col-span-12 md:col-span-1 font-mono text-xs text-[#8a7d6e] tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className="col-span-12 md:col-span-8">
                  <div className="font-display text-2xl text-[#1a1612] leading-snug group-hover:text-[#7d3c3c] transition-colors">
                    {h.title}
                  </div>
                </div>
                <div className="col-span-12 md:col-span-3 flex md:flex-col md:items-end gap-3 md:gap-1 font-mono text-[10px] uppercase tracking-wider text-[#8a7d6e]">
                  <span>
                    {h.source}{' '}
                    <span className="text-[#7d3c3c]">[{h.country}]</span>
                  </span>
                  <span className="hidden md:inline">{h.date}</span>
                  <span className="text-[#7d3c3c] italic">{h.cat}</span>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* sources + keywords */}
        <section
          className="max-w-6xl mx-auto px-8 py-16 border-t"
          style={{ borderColor: '#d8cfb8' }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#7d3c3c] mb-3">
                Figure IV · 한국 매체 분포
              </div>
              <h3 className="font-display text-3xl text-[#1a1612] leading-tight mb-8">
                누가 가장 많이 다루는가
              </h3>
              <div className="space-y-4">
                {data.sourceDist.map((s) => (
                  <div
                    key={s.source}
                    className="grid grid-cols-12 items-center gap-4"
                  >
                    <div className="col-span-3 font-display text-lg text-[#1a1612]">
                      {s.source}
                    </div>
                    <div className="col-span-7">
                      <div
                        className="h-px"
                        style={{
                          width: `${(s.count / maxSrc) * 100}%`,
                          backgroundColor: '#7d3c3c',
                        }}
                      />
                    </div>
                    <div className="col-span-2 text-right font-mono text-xs text-[#8a7d6e] tabular-nums">
                      {s.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#7d3c3c] mb-3">
                Figure V · 어휘의 무게
              </div>
              <h3 className="font-display text-3xl text-[#1a1612] leading-tight mb-8">
                자주 등장한 단어들
              </h3>
              <div className="space-y-5">
                {data.keywords.map((k) => (
                  <div
                    key={k.word}
                    className="border-b pb-4"
                    style={{ borderColor: '#d8cfb8' }}
                  >
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-display text-2xl italic text-[#1a1612]">
                        {k.word}
                      </span>
                      <span className="font-mono text-xs text-[#8a7d6e] tabular-nums">
                        {k.count}
                      </span>
                    </div>
                    <div className="h-px bg-[#d8cfb8] relative">
                      <div
                        className="absolute left-0 top-0 h-px"
                        style={{
                          width: `${(k.count / maxKw) * 100}%`,
                          backgroundColor: '#7d3c3c',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* colophon */}
        <footer
          className="max-w-6xl mx-auto px-8 py-16 border-t"
          style={{ borderColor: '#2a2418' }}
        >
          <div className="text-center mb-10">
            <div className="font-display italic text-[#5a4f3e] text-lg mb-2">
              Colophon
            </div>
            <div
              className="w-12 h-px mx-auto"
              style={{ backgroundColor: '#7d3c3c' }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-sm leading-relaxed">
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#7d3c3c] mb-3">
                Method
              </div>
              <p className="font-body text-[#2a2418] italic">
                네이버 뉴스 API와 영문 매체 RSS를 통한 메타데이터 자동 수집.
                본문은 영구 저장하지 않으며, 원문은 원 매체에서 읽는다.
              </p>
            </div>
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#7d3c3c] mb-3">
                Caveat
              </div>
              <p className="font-body text-[#2a2418] italic">
                보도의 양은 사건의 무게가 아니라 의제 형성의 결과이다. 매체별 입장차와
                언어 간 비대칭성은 별도의 해석을 요구한다.
              </p>
            </div>
            <div>
              <div className="font-mono text-[9px] tracking-[0.3em] uppercase text-[#7d3c3c] mb-3">
                Notice
              </div>
              <p className="font-body text-[#2a2418] italic">
                모든 헤드라인은 원문 매체로 연결된다. 동향의 색인을 목적으로 한다.
              </p>
            </div>
          </div>
          <div className="mt-16 text-center">
            <div className="font-mono text-[10px] tracking-[0.4em] uppercase text-[#8a7d6e]">
              Earthen Mount · MMXXVI
            </div>
            <div className="font-display italic text-sm text-[#5a4f3e] mt-2">
              &ldquo;흙을 쌓아 산을 만든다&rdquo;
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

function FontStyles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,400&family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@300;400&display=swap');
      .font-display {
        font-family: 'Cormorant Garamond', serif;
        font-weight: 300;
        letter-spacing: -0.02em;
      }
      .font-body {
        font-family: 'EB Garamond', serif;
      }
      .font-mono {
        font-family: 'JetBrains Mono', monospace;
      }
      .recharts-text {
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 10px !important;
        fill: #8a7d6e !important;
      }
      @keyframes pulse-soft {
        0%,
        100% {
          opacity: 0.4;
        }
        50% {
          opacity: 1;
        }
      }
      .pulse-soft {
        animation: pulse-soft 2s ease-in-out infinite;
      }
    `}</style>
  );
}
