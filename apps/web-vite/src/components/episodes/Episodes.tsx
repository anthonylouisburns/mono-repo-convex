"use client";

import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { EpisodeTitle } from "./EpisodeTitle";
import { useParams } from "react-router-dom";

export default function Episodes() {
  const { podcast_id } = useParams();

  if (!podcast_id) {
    return <>No such episode</>;
  }
  const episodes = useQuery(api.everwhz.episodes, {
    podcast_id: podcast_id as Id<"podcast">,
  });
  const podcast = useQuery(api.everwhz.podcastTitle, {
    id: podcast_id as Id<"podcast">,
  });
  console.log("podcast_id:", podcast_id);

  return (
    <div>
      <div className="pagePadding">
        <span dangerouslySetInnerHTML={{ __html: podcast?.title ?? "" }} />
        <span dangerouslySetInnerHTML={{ __html: podcast?.description ?? "" }} />
        {episodes &&
          episodes.map((episode) => (
            <EpisodeTitle key={episode._id} episode={episode} />
          ))}
      </div>
    </div>
  );
}
