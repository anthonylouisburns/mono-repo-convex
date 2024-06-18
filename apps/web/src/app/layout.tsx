import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ConvexClientProvider from './ConvexClientProvider';
import EverwhzHeader from '@/components/EverwhzHeader';
import Player from '@/components/Player'; import {
  Authenticated,
  Unauthenticated,
} from "convex/react";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Everwhz',
  description: 'as it everwhz',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body>
        <ConvexClientProvider>
          <EverwhzHeader />

          <Authenticated>
            <Player />
            {children}
          </Authenticated>
          <Unauthenticated>
            return (
            <div>
              <EverwhzHeader />
              <h1 className="header-center rainbow-text">
                login and Explore Historical Podcasts
              </h1>
            </div>
          </Unauthenticated>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
