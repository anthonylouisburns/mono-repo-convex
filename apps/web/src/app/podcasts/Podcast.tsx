
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Dispatch, SetStateAction } from "react";
import Link from "next/link";

export const Podcast = function Podcast({ podcast, podcastColor, setName, setRss }: { podcast: Doc<"podcast">, podcastColor: string, setName: Dispatch<SetStateAction<string>>, setRss: Dispatch<SetStateAction<string>> }): JSX.Element {
    const deletePodcast = useMutation(api.everwzh.deletePodcast);
    const redStyle = { color: "red" }

    return <div className=" boxStyle">
        <Link className="linkStyle" href={{
    pathname: '/episodes',
    query: { podcast_id: podcast._id },
  }}>{podcast.name}</Link> {podcast.number_of_episodes || 0} episodes <a style={redStyle} onClick={() => {
            setName(podcast.name)
            setRss(podcast.rss_url)
            deletePodcast({ id: podcast._id })
                .catch((reason) => console.error(reason));
        }}>x</a><br />
        {podcast.rss_url}
    </div>
}

