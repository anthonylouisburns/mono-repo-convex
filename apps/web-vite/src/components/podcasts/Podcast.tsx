import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";

export const Podcast = function Podcast({
  podcast,
  setName,
  setRss,
}: {
  podcast: Doc<"podcast">;
  podcastColor: string;
  setName: Dispatch<SetStateAction<string>>;
  setRss: Dispatch<SetStateAction<string>>;
}): JSX.Element {
  const deletePodcast = useMutation(api.everwhz.deletePodcast);
  const redStyle = { color: "red" };
  const updatePodcastRssData = useMutation(api.everwhz.updatePodcastRssData);

  return (
    <div className="boxStyle">
      <Link className="navigation" to={"/episodes/" + podcast._id}>
        {podcast.title ? podcast.title : "title not set"}
      </Link>
      <button
        className="navigation-button"
        onClick={() => updatePodcastRssData({ id: podcast._id })}
      >
        {podcast.number_of_episodes || 0} episodes
      </button>
      <a
        style={redStyle}
        onClick={() => {
          setName(podcast.title ? podcast.title : "title not set");
          setRss(podcast.rss_url);
          deletePodcast({ id: podcast._id }).catch((reason) =>
            console.error(reason),
          );
        }}
      >
        x
      </a>
      <br />
      {podcast.rss_url}
    </div>
  );
};

// <button className='navigation-button' onClick={() => updatePodcastRssData()}>podcasts refresh</button>
