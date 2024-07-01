'use client';

import { useQuery, } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useState } from "react";
import { EpisodeSelect, FIRST_ELEMENT } from './EpisodesSelect';
import { EpisodeById } from './EpisodeById';
import { Doc, } from '@packages/backend/convex/_generated/dataModel';
import { timedisplay } from "@packages/backend/utilities/utility";
import Link from "next/link";
import { Button } from '@/components/common/button';
import { EditSpans } from './EditSpans';




export default function Timeline() {
  const spans = useQuery(api.everwzh.timeline)
  const podcasts = useQuery(api.everwzh.podcasts);
  const [selectedPodcast, setSelectedPod] = useState<Id<"podcast"> | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<Id<"episode"> | null>(null);
  const [selectedOption, setSelectedOption] = useState<{ label: string, value: string | null, key: string | null } | null>(null);


  function selectSpan(span: Doc<"timespan">, episode: Doc<"episode"> | null) {
    console.log("select span", span.podcast_id, span.episode_id)
    setSelectedPod(span.podcast_id)
    setSelectedEpisode(span.episode_id ? span.episode_id : null)

    if (episode) {
      setSelectedOption({ label: episode.body.title, value: episode._id, key: episode._id })
    } else {
      setSelectedOption(FIRST_ELEMENT)
    }
  }

  const onChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setSelectedPod(value as Id<"podcast">);
  };

  function spanDisplay(span: Doc<"timespan">, episode: Doc<"episode"> | null, podcast: Doc<"podcast"> | null) {
    const podView = podcast ? (
      <div><Link href={{
        pathname: '/episodes',
        query: { podcast_id: podcast._id },
      }} className="linkStyle1">
        {podcast.title}
      </Link></div>
    ) : (
      <></>
    )

    const episodeView = episode ? (
      <div><Link href={{
        pathname: '/episodes',
        query: { episode_id: episode._id },
      }} className="linkStyle2">
        <div dangerouslySetInnerHTML={{ __html: episode?.body.title }} />
      </Link></div>
    ) : (
      <></>
    )


    return (
      <div className="boxStyle">
        <div key={span._id} className='linkStyle3' onClick={() => selectSpan(span, episode)}>{timedisplay(span.start)} to {timedisplay(span.end)} <b>{span.name}</b></div>
        {podView}
        {episodeView}
      </div>
    )
  }

  const editSpansView = selectedPodcast ? <EditSpans podcast_id={selectedPodcast} episode_id={selectedEpisode ? selectedEpisode : undefined} /> : ""
  return (
    <div>
      <div className="pagePadding">
        <select
          className="text-input"
          value={selectedPodcast || "-"} onChange={e => onChange(e)}>
          <option key="-">-</option>
          {podcasts &&
            podcasts.map((podcast) => (
              <option id={podcast._id} value={podcast._id} key={podcast._id}>{podcast.title}</option>
            ))}
        </select>

        <EpisodeSelect podcast_id={selectedPodcast} selectedOption={selectedOption} setSelectedOption={setSelectedOption} setSelectedEpisode={setSelectedEpisode} />
        {editSpansView}

        {spans && spans.map(({ span, episode, podcast }) => (
          <div key={span._id}>
            {spanDisplay(span, episode, podcast)}
          </div>
        ))}
      </div>
    </div>)
}

