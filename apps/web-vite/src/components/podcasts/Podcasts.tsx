"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { Podcast } from "./Podcast";
import { useState } from "react";

export default function Podcasts() {
  const podcasts = useQuery(api.everwhz.podcasts);
  const total_episodes = podcasts?.reduce(
    (acc, podcast) => acc + (podcast.number_of_episodes || 0),
    0,
  );
  const [, setName] = useState("");
  const [rss, setRss] = useState("");

  return (
    <div>
      <div className="pagePadding">
        <div>
          <b>total episodes {total_episodes}</b>
        </div>
        {podcasts &&
          podcasts.map((podcast) => (
            <Podcast
              podcast={podcast}
              podcastColor="black"
              setName={setName}
              setRss={setRss}
              key={podcast._id}
            />
          ))}
      </div>
    </div>
  );
}
