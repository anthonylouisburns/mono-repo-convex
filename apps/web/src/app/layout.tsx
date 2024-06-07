import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ConvexClientProvider from './ConvexClientProvider';
import Link from 'next/link';
import { useRouter } from 'next/router'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Everwhz',
  description: 'as it Everwhz.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>
      <Link href="/">everwzh</Link> | <Link href="/podcasts">podcasts</Link> | <Link href="/episodes">episodes</Link> | <Link href="/timeline">timeline</Link>
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
