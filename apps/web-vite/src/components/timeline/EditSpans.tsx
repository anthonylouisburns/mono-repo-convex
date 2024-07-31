"use client";

import { Doc, Id, } from "@packages/backend/convex/_generated/dataModel";
import { useQuery } from 'convex/react';
import { api } from "@packages/backend/convex/_generated/api";
import { TimeSpans } from "../TimeSpans";

export const EditSpans = function Episode({ podcast_id, episode_id }: { podcast_id: Id<"podcast">, episode_id: Id<"episode"> | undefined }): JSX.Element {
    const timespans: Array<Doc<"timespan">> = useQuery(api.everwhz.timespans, { podcast_id: podcast_id, episode_id: episode_id }) ?? [];

    if (episode_id) {
        return (
            <TimeSpans spans={timespans} podcast_id={podcast_id} episode_id={episode_id} />
        )
    } else {
        return (
            <TimeSpans spans={timespans} podcast_id={podcast_id} episode_id={undefined} />
        )
    }
}