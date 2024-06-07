'use client';

import { useQuery, } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Doc, } from '@packages/backend/convex/_generated/dataModel';
import { boxStyle, linkStyle, timedisplay } from "@packages/backend/utilities/utility";
import Link from "next/link";


function spanDisplay(span:Doc<"timespan">, episode:Doc<"episode">|null, podcast:Doc<"podcast">|null) {

  const podView = podcast?(
    <div><Link  href={{
      pathname: '/pod_episodes',
      query: { podcast_id: podcast._id },
    }} style={linkStyle}>{podcast.name}</Link></div>
   ):(
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

  return <div>
    {spans && spans.map(({ span, episode, podcast }) => (
      <>
        {spanDisplay(span, episode, podcast)}
      </>
    ))}
  </div>
}

