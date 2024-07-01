'use client';

import { useQuery, } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { useSearchParams } from 'next/navigation'
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { Episode } from '../timeline/Episode';

export default function Page() {
  const params = useSearchParams()
  const podcast_id = params.get('podcast_id')
  const episodes = useQuery(api.everwzh.episodes, { podcast_id: podcast_id as Id<"podcast"> })
  console.log("podcast_id:", podcast_id)
  if (!podcast_id) {
    return <>No such episode</>
  }

  return <div>
    <div className="pagePadding">
      {episodes &&
        episodes.map((episode) => (
          <Episode key={episode._id} episode={episode} />
        ))}
    </div>
  </div>
}

