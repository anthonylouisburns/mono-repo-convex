'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Button } from '@/components/common/button';
import { Podcast } from '../podcasts/Podcast';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation'
import { Id } from '@packages/backend/convex/_generated/dataModel';
import EverwhzHeader from '@/components/EverwhzHeader';
import { Episode } from '../timeline/Episode';

export default function About() {
  const params = useSearchParams()
  const episode_id = params.get('episode_id')

  if (!episode_id) {
    return <>No such episode</>
  }
  const episode = useQuery(api.everwzh.episode, { id: episode_id as Id<"episode"> })

  return <div>
    <EverwhzHeader />
    <div className="heavy" dangerouslySetInnerHTML={{ __html: episode?.body.title }} />
    <div dangerouslySetInnerHTML={{ __html: episode?.body["content:encoded"] }} />
  </div>
}

