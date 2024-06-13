
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { TimeSpans } from "../TimeSpans";
import { useQuery, useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { linkStyle } from "@packages/backend/utilities/utility";

export const Podcast = function Podcast({ podcast, podcastColor, setName, setRss }: { podcast: Doc<"podcast">, podcastColor: string, setName: Dispatch<SetStateAction<string>>, setRss: Dispatch<SetStateAction<string>> }): JSX.Element {
    const deletePodcast = useMutation(api.everwzh.deletePodcast);
    const podcastStyle = { borderColor: podcastColor, borderWidth: 2, margin: 10, borderRadius: 3, textAlign: 'center' as const }
    const redStyle = { color: "red" }
    const timespans:Array<Doc<"timespan">> = useQuery(api.everwzh.timespans, {podcast_id: podcast._id}) ?? [];

    return <div style={podcastStyle}>
        <Link style={linkStyle} href={{
    pathname: '/episodes',
    query: { podcast_id: podcast._id },
  }}>{podcast.name}</Link> {podcast.number_of_episodes || 0} episodes <a style={redStyle} onClick={() => {
            setName(podcast.name)
            setRss(podcast.rss_url)
            deletePodcast({ id: podcast._id })
                .catch((reason) => console.error(reason));
        }}>x</a><br />
        {podcast.rss_url}<br />
        {podcast.rss_body || "-"}

        <TimeSpans spans={timespans} podcast_id={podcast._id} episode_id={undefined} />
    </div>
}

