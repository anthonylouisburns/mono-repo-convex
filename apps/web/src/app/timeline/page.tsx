'use client';

import { useQuery, } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useState } from "react";
import { EpisodeSelect } from './EpisodesSelect';
import { EpisodeById } from './EpisodeById';
import { Doc, } from '@packages/backend/convex/_generated/dataModel';
import { boxStyle, linkStyle, timedisplay } from "@packages/backend/utilities/utility";
import Link from "next/link";


function spanDisplay(span: Doc<"timespan">, episode: Doc<"episode"> | null, podcast: Doc<"podcast"> | null) {

  const podView = podcast ? (
    <div><Link href={{
      pathname: '/episodes',
      query: { podcast_id: podcast._id },
    }} style={linkStyle}>{podcast.name}</Link></div>
  ) : (
    <></>
  )

  return (
    <div style={boxStyle}>
      <div key={span._id}><b>{span.name}</b> {timedisplay(span.start)} to {timedisplay(span.end)}</div>
      {podView}
      <div>{episode ? episode.body["title"] : ""}</div>
    </div>
  )
}

export default function About() {
  const spans = useQuery(api.everwzh.timeline)
  const podcasts = useQuery(api.everwzh.podcasts);
  const [selectedPodcast, setSelectedPod] = useState<Id<"podcast"> | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Id<"episode"> | null>(null);

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedPod(value as Id<"podcast">);
  };

  const episode = selectedEpisode ? <EpisodeById episode_id={selectedEpisode} /> : ""
  return (
    <div>
      <div className="pagePadding">
        <select value={selectedPodcast || "-"} onChange={e => onChange(e)}>
          <option>-</option>
          {podcasts &&
            podcasts.map((podcast) => (
              <option id={podcast._id} value={podcast._id} key={podcast._id}>{podcast.name}-{podcast._id}</option>
            ))}
        </select>

        <EpisodeSelect podcast_id={selectedPodcast} setSelectedEpisode={setSelectedEpisode} />
        {episode}

        {spans && spans.map(({ span, episode, podcast }) => (
          <>
            {spanDisplay(span, episode, podcast)}
          </>
        ))}
      </div>
    </div>)
}

