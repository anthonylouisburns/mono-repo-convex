'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Button } from '@/components/common/button';
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { JSXSource } from 'react/jsx-dev-runtime';
import { EpisodeSelect } from './EpisodesSelect';
import { Episode } from './Episode';
import { EpisodeById } from './EpisodeById';

export default function About() {
  const podcasts = useQuery(api.everwzh.podcasts);
  const [selectedPodcast, setSelectedPod] = useState<Id<"podcast"> | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Id<"episode"> | null>(null);

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedPod(value as Id<"podcast">);
  };

  const episode = selectedEpisode ? <EpisodeById episode_id={selectedEpisode} /> : ""
  return <div>
    <select value={selectedPodcast || "-"} onChange={e => onChange(e)}>
      <option>-</option>
      {podcasts &&
        podcasts.map((podcast) => (
          <option id={podcast._id} value={podcast._id}>{podcast.name}-{podcast._id}</option>
        ))}
    </select>

    <EpisodeSelect podcast_id={selectedPodcast} setSelectedEpisode={setSelectedEpisode} />
    {episode}
  </div>
}

