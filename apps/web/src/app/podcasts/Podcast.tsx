"use client";

import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { Options } from "distinct-colors"
import distinctColors from "distinct-colors"
import { TimeSpans } from "../TimeSpans";
import { useQuery, useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';

export const Podcast = function Podcast({podcast, podcastColor}:{podcast:Doc<"podcast">, podcastColor:string}):JSX.Element{
    const patchPodcastTimeSpan = useMutation(api.everwzh.patchPodcastTimeSpan)
    const deletePodcastTimeSpan = useMutation(api.everwzh.deletePodcastTimeSpan)

    function addTimeSpan(span: { name: string, start: string, end: string }) {
        patchPodcastTimeSpan({ id: podcast._id, timespan: span })
    }

    function deleteSpan(index: number) {
        deletePodcastTimeSpan({ id: podcast._id, index})
    }


    const podcastStyle = { borderColor: podcastColor, borderWidth: 2, margin: 10, borderRadius: 3, textAlign: 'center' as const }
    return <div style={podcastStyle}>
        {podcast.name} {podcast.number_of_episodes || 0} episodes<br/>
        {podcast.rss_url}<br/>
        {podcast.rss_body || "-"}
        <TimeSpans spans={podcast.timeSpans ? podcast.timeSpans : []}  addSpan={addTimeSpan} deleteSpan={deleteSpan}/>
    </div>
}

