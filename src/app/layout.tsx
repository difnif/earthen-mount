import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Earthen Mount · 우크라이나 정세 관측소',
  description: '한국과 세계 매체의 우크라이나 보도 동향 아카이브. 메타데이터 기반 색인.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
