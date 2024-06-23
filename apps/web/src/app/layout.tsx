
import type { Metadata } from 'next';
import './globals.css';
import ConvexClientProvider from './ConvexClientProvider';
import EverwhzHeader from '@/components/EverwhzHeader';
import Player from '@/components/Player';
import Base from './Base';
import Head from 'next/head';
import { useState } from 'react';
import PlayerHolder from '@/components/PlayerHolder';


export const metadata: Metadata = {
  title: 'everwhz!',
  description: 'as it everwhz',
  icons: {
    icon: '/images/icons8-nautilus-96.png',
  },
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
          <Base>
            <EverwhzHeader />
            <PlayerHolder/>
            {children}
          </Base>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
