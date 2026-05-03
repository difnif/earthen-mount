import { Dashboard } from '@/components/Dashboard';

export const revalidate = 300;

async function getData() {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  try {
    const res = await fetch(`${base}/api/dashboard-data`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function Page() {
  const data = await getData();
  return <Dashboard data={data} />;
}
