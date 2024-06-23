"use client";

import { Doc,  } from "@packages/backend/convex/_generated/dataModel";
import Link from "next/link";

export const Episode = function Episode({ episode }: { episode: Doc<"episode"> }): JSX.Element {
    // const timespans:Array<Doc<"timespan">> = useQuery(api.everwzh.timespans, {podcast_id: episode.podcast_id, episode_id: episode._id}) ?? [];

    return <div>
        <Link className="navigation-light" href={{
            pathname: "/episode",
            query: {episode_id: episode._id}
        }}>
        <div dangerouslySetInnerHTML={{ __html: episode?.body.title }} />
        </Link>
        {/* <TimeSpans spans={timespans} podcast_id={episode.podcast_id} episode_id={episode._id} /> */}
    </div>
}