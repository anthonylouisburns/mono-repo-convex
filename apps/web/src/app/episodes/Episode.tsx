"use client";

import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery, useMutation } from 'convex/react';
import { TimeSpans } from "../TimeSpans";

export const Episode = function Episode({ episode }: { episode: Doc<"episode"> }): JSX.Element {
    const timespans:Array<Doc<"timespan">> = useQuery(api.everwzh.timespans, {podcast_id: episode.podcast_id, episode_id: episode._id}) ?? [];

    return <div><div dangerouslySetInnerHTML={{ __html: episode?.body.title }} />
        <TimeSpans spans={timespans} podcast_id={episode.podcast_id} episode_id={episode._id} />
    </div>
}