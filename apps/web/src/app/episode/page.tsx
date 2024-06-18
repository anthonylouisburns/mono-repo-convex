'use client';

import { useQuery, } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { useSearchParams } from 'next/navigation'
import { Id } from '@packages/backend/convex/_generated/dataModel';
import EverwhzHeader from '@/components/EverwhzHeader';

export default function About() {
  const params = useSearchParams()
  const episode_id = params.get('episode_id')
  const episode = useQuery(api.everwzh.episode, { id: episode_id as Id<"episode"> })

  if (!episode_id) {
    return <>No such episode</>
  }

  return <div>
    <div className="pagePadding">
      <div className="heavy" dangerouslySetInnerHTML={{ __html: episode?.body.title }} />
      <div className="dangerous" dangerouslySetInnerHTML={{ __html: episode?.body["content:encoded"] }} />
    </div>
  </div>
}

