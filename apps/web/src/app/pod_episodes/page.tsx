'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Button } from '@/components/common/button';
import { Podcast } from '../podcasts/Podcast';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation'
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { Episode } from '../episodes/Episode';

export default function About() {
    const params = useSearchParams()
    const podcast_id = params.get('podcast_id')
    
    if(!podcast_id){
        return <>No such podcast</>
    }
    const episodes = useQuery(api.everwzh.episodes, {podcast_id: podcast_id as Id<"podcast">})

    return <div>
            {episodes &&
          episodes.map((episode) => (
            <Episode key="{episode._id}" episode={episode} />
          ))}
    </div>
}

