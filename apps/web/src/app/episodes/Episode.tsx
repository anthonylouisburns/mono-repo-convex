"use client";

import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { TimeSpans } from "../TimeSpans";

export const Episode = function Episode({ episode_id }: { episode_id: Id<"episode"> }): JSX.Element {
    const patchEpisodeTimeSpan = useMutation(api.everwzh.patchEpisodeTimeSpan)
    const deleteEpisodeTimeSpan = useMutation(api.everwzh.deleteEpisodeTimeSpan)

    function addTimeSpan(span: { name: string, start: string, end: string }) {
        patchEpisodeTimeSpan({ id: episode_id as Id<"episode">, timespan: span })
    }

    function deleteSpan(index: number) {
        deleteEpisodeTimeSpan({ id: episode_id as Id<"episode">, index })
    }
    const episode = useQuery(api.everwzh.episode, { id: (episode_id) });

    return <div><div dangerouslySetInnerHTML={{ __html: episode?.body.title }} />
        <TimeSpans spans={(episode && episode.timeSpans) ? episode.timeSpans : []} addSpan={addTimeSpan} deleteSpan={deleteSpan} />
    </div>
}