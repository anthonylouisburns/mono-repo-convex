'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div>
      <Link href="/">everwzh</Link><br/>
      <Link href="/podcasts">podcasts</Link><br/>
      <Link href="/episodes">episodes</Link>
    </div>
  );
}

// TODO: WEB - delete unused code
// [ ] save user info https://docs.convex.dev/auth/database-auth