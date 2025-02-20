"use client";

import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useSearchParams } from "next/navigation";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { useContext } from "react";
import { AudioContext } from "@/components/AudioContext";
import { Button } from "@/components/common/button";

export default function About(): JSX.Element {
  const params = useSearchParams();
  const episode_id = params.get("episode_id");

  const episodeName = useQuery(api.everwhz.episodeName, {
    id: episode_id as Id<"episode">,
  });
  const { episode, podcast } = episodeName
    ? episodeName
    : { episode: null, podcast: null };
  const player_podcast_name = podcast?.title;

  const { setPlayerEpisodeId } = useContext(AudioContext);

  async function selectEpisode() {
    setPlayerEpisodeId(episode_id as Id<"episode">);
  }
  if (!episode_id) {
    return <>No such episode</>;
  }

  return (
    <div>
      <div className="pagePadding">
        {player_podcast_name}
        <div
          className="heavy"
          dangerouslySetInnerHTML={{
            __html: episode?.title ? episode.title : "",
          }}
        />
        <button className="navigation-button" onClick={() => selectEpisode()}>
          +
        </button>
        <div
          className="dangerous"
          dangerouslySetInnerHTML={{ __html: episode?.body["content:encoded"] }}
        />
      </div>
    </div>
  );
}
