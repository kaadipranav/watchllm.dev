import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WatchLLM - AI API Cost Optimization',
  description: 'Reduce your OpenAI costs by 40-70% with semantic caching',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
