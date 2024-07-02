
import type { Metadata } from 'next';
import './globals.css';
import ConvexClientProvider from './ConvexClientProvider';
import EverwhzHeader from '@/components/EverwhzHeader';
import Player from '@/components/Player';
import Base from './Base';
import Head from 'next/head';
import { useState } from 'react';
import PlayerHolder from '@/components/PlayerHolder';
import Link from 'next/link';


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

  console.log("process.env.CONVEX_URL", process.env.CONVEX_URL!)
  return (
    <html lang='en'>
      <body>
        <ConvexClientProvider>
          <Base>
            <EverwhzHeader />
            <PlayerHolder />
            {children}
          </Base>
        </ConvexClientProvider>
        <div></div>
      </body>
      {/* <div className="everwhzFooter">
    everwhz is a visual guide to history podcasts. Every effort is made to respect all users privacy. The privacy policy is avaialble <Link className="everwhzFooterLink" href="privacy.txt">here</Link><br />
    <Link target="_blank" href="https://icons8.com/icon/M4NWZSea5Snr/nautilus">Nautilus</Link> icon by <Link className="everwhzFooterLink" target="_blank" href="https://icons8.com">Icons8</Link>
  </div> */}
    </html>
  );
}
