'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Button } from '@/components/common/button';
import { Podcast } from './Podcast';
import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import EverwhzHeader from '@/components/EverwhzHeader';


export default function Page() {
  const podcasts = useQuery(api.everwzh.podcasts);
  const refreshRssBody = useMutation(api.everwzh.updateRssData);
  const addPodcast = useMutation(api.everwzh.addPodcast);
  const total_episodes = podcasts?.reduce((acc, podcast) => acc + (podcast.number_of_episodes || 0), 0)
  const [name, setName] = useState('');
  const [rss, setRss] = useState('');

  return <div>
    <EverwhzHeader />
    <div><b>total episodes {total_episodes}</b></div>
    <div><Button onClick={() => {
      addPodcast({ name: name, rss_url: rss })
    }}>+</Button>
      name: <input type="text" value={name} onChange={e => setName(e.target.value)} id="podcast_name" />
      rss: <input type="text" value={rss} onChange={e => setRss(e.target.value)} id="podcast_rss" /></div>
    <Button onClick={() => refreshRssBody()}>podcasts refresh</Button>
    {podcasts &&
      podcasts.map((podcast) => (
        <Podcast key="{podcast._id}" podcast={podcast} podcastColor='black' setName={setName} setRss={setRss} />
      ))}
  </div>
}

