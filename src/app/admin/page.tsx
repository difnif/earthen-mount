'use client';

import { useState, useEffect } from 'react';

interface CollectResult {
  ok?: boolean;
  added?: number;
  skipped?: number;
  errors?: string[];
  error?: string;
}

interface RunRow {
  started_at: string;
  completed_at: string | null;
  articles_added: number | null;
  articles_skipped: number | null;
  status: string;
  error: string | null;
}

export default function AdminPage() {
  const [secret, setSecret] = useState('');
  const [saved, setSaved] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CollectResult | null>(null);
  const [logs, setLogs] = useState<RunRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  // 페이지 진입 시 sessionStorage에서 비밀번호 복원 (탭 닫으면 사라짐)
  useEffect(() => {
    const saved = sessionStorage.getItem('em_secret');
    if (saved) {
      setSecret(saved);
      setSaved(true);
    }
  }, []);

  const handleSave = () => {
    if (!secret.trim()) return;
    sessionStorage.setItem('em_secret', secret);
    setSaved(true);
    fetchLogs();
  };

  const handleClear = () => {
    sessionStorage.removeItem('em_secret');
    setSecret('');
    setSaved(false);
    setResult(null);
    setLogs([]);
  };

  const handleCollect = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/collect', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      const data: CollectResult = await res.json();
      setResult(data);
      if (res.ok) {
        // 수집 후 로그 새로고침
        setTimeout(fetchLogs, 1000);
      }
    } catch (e) {
      setResult({ error: (e as Error).message });
    } finally {
      setRunning(false);
    }
  };

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await fetch('/api/admin/runs', {
        headers: { Authorization: `Bearer ${secret}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.runs || []);
      }
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=JetBrains+Mono:wght@300;400&display=swap');
        .font-body { font-family: 'EB Garamond', serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      <div
        className="min-h-screen font-body"
        style={{ backgroundColor: '#f5f0e6', color: '#2a2418' }}
      >
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* header */}
          <div className="mb-10">
            <div className="font-mono text-[10px] tracking-[0.3em] uppercase text-[#8a7d6e] mb-2">
              Earthen Mount · Admin
            </div>
            <h1 className="font-body text-3xl text-[#1a1612] italic">
              수동 수집
            </h1>
            <p className="font-body text-[#5a4f3e] mt-2 italic text-sm">
              cron이 도는 시간 사이에 즉시 수집을 트리거할 수 있다.
            </p>
            <div
              className="w-12 h-px mt-4"
              style={{ backgroundColor: '#7d3c3c' }}
            />
          </div>

          {/* 비밀번호 입력 단계 */}
          {!saved ? (
            <div className="space-y-4">
              <div className="font-mono text-[10px] tracking-widest uppercase text-[#7d3c3c]">
                비밀번호 입력
              </div>
              <input
                type="password"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                placeholder="CRON_SECRET"
                className="w-full font-mono text-sm px-4 py-3 border-2 bg-transparent outline-none focus:border-[#7d3c3c] transition-colors"
                style={{ borderColor: '#d8cfb8', color: '#2a2418' }}
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={!secret.trim()}
                className="font-mono text-xs uppercase tracking-widest px-6 py-3 transition-all disabled:opacity-30"
                style={{
                  backgroundColor: '#7d3c3c',
                  color: '#f5f0e6',
                }}
              >
                Enter
              </button>
              <p className="font-body italic text-xs text-[#8a7d6e] mt-4">
                비밀번호는 이 브라우저 세션에만 저장된다. 탭을 닫으면 사라진다.
              </p>
            </div>
          ) : (
            <>
              {/* 수집 트리거 */}
              <div
                className="border-2 p-6 mb-8"
                style={{ borderColor: '#d8cfb8', backgroundColor: '#ede5d2' }}
              >
                <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                  <div>
                    <div className="font-mono text-[10px] tracking-widest uppercase text-[#7d3c3c] mb-1">
                      Trigger
                    </div>
                    <div className="font-body text-xl italic text-[#1a1612]">
                      지금 수집
                    </div>
                  </div>
                  <button
                    onClick={handleClear}
                    className="font-mono text-[10px] uppercase tracking-widest text-[#8a7d6e] hover:text-[#7d3c3c] transition-colors"
                  >
                    비밀번호 초기화
                  </button>
                </div>

                <button
                  onClick={handleCollect}
                  disabled={running}
                  className="w-full font-mono text-sm uppercase tracking-widest py-4 transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: running ? '#8a7d6e' : '#7d3c3c',
                    color: '#f5f0e6',
                  }}
                >
                  {running ? '수집 중... (30~60초)' : '수집 실행'}
                </button>

                {/* 결과 표시 */}
                {result && (
                  <div className="mt-6 pt-6 border-t" style={{ borderColor: '#d8cfb8' }}>
                    {result.ok ? (
                      <div className="space-y-2">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#3c6b4a]">
                          ✓ Success
                        </div>
                        <div className="font-body text-[#2a2418]">
                          <span className="font-mono text-sm tabular-nums">
                            {result.added}
                          </span>{' '}
                          <span className="italic text-sm text-[#5a4f3e]">건 추가</span>
                          {' · '}
                          <span className="font-mono text-sm tabular-nums">
                            {result.skipped}
                          </span>{' '}
                          <span className="italic text-sm text-[#5a4f3e]">건 중복 처리</span>
                        </div>
                        {result.errors && result.errors.length > 0 && (
                          <details className="mt-3">
                            <summary className="font-mono text-[10px] uppercase tracking-widest text-[#8a7d6e] cursor-pointer">
                              일부 소스 경고 ({result.errors.length})
                            </summary>
                            <ul className="mt-2 font-mono text-[10px] text-[#8a7d6e] space-y-1">
                              {result.errors.map((e, i) => (
                                <li key={i}>{e}</li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="font-mono text-[10px] uppercase tracking-widest text-[#7d3c3c]">
                          ✗ Failed
                        </div>
                        <div className="font-mono text-xs text-[#5a4f3e]">
                          {result.error || '알 수 없는 오류'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 최근 수집 로그 */}
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="font-body text-xl italic text-[#1a1612]">
                    최근 수집 기록
                  </h2>
                  <button
                    onClick={fetchLogs}
                    disabled={loadingLogs}
                    className="font-mono text-[10px] uppercase tracking-widest text-[#8a7d6e] hover:text-[#7d3c3c] transition-colors disabled:opacity-50"
                  >
                    {loadingLogs ? '...' : '새로고침'}
                  </button>
                </div>

                {logs.length === 0 ? (
                  <p className="font-body italic text-sm text-[#8a7d6e]">
                    아직 기록이 없습니다.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {logs.map((log, i) => (
                      <div
                        key={i}
                        className="border p-3 text-sm flex items-baseline justify-between flex-wrap gap-2"
                        style={{ borderColor: '#d8cfb8' }}
                      >
                        <div className="flex items-baseline gap-3">
                          <span
                            className="font-mono text-[10px] uppercase tracking-widest"
                            style={{
                              color:
                                log.status === 'completed'
                                  ? '#3c6b4a'
                                  : log.status === 'partial'
                                  ? '#8b6a3c'
                                  : log.status === 'failed'
                                  ? '#7d3c3c'
                                  : '#8a7d6e',
                            }}
                          >
                            {log.status}
                          </span>
                          <span className="font-mono text-[11px] text-[#5a4f3e] tabular-nums">
                            {new Date(log.started_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        <div className="font-mono text-xs text-[#5a4f3e] tabular-nums">
                          +{log.articles_added ?? 0} / ~{log.articles_skipped ?? 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
