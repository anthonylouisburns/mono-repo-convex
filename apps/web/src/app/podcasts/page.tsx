'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Button } from '@/components/common/button';
import { Podcast } from './Podcast';
import { List } from 'postcss/lib/list';


export default function About() {
    const podcasts = useQuery(api.everwzh.podcasts);
    const refreshRssBody = useMutation(api.everwzh.updateRssData);
    const total_episodes = podcasts?.reduce((acc, podcast) => acc + (podcast.number_of_episodes || 0), 0)
    return <div>
            <div><b>total episodes {total_episodes}</b></div>
        <Button onClick={()=>refreshRssBody()}>podcasts refresh</Button>
        {podcasts &&
          podcasts.map((podcast) => (
            <Podcast podcast={podcast} podcastColor='black'/>
          ))}
    </div>
}

