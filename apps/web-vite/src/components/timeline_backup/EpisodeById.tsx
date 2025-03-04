"use client";

import { Id } from "@packages/backend/convex/_generated/dataModel";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { EpisodeTitle } from "../episodes/EpisodeTitle";
import { useParams } from "react-router-dom";

export const EpisodeById = function EpisodeById(): JSX.Element {
  const { episode_id } = useParams();
  if (!episode_id) {
    return <>no episode found</>;
  }
  const episode = useQuery(api.everwhz.episode, {
    id: episode_id as Id<"episode">,
  });

  if (episode) {
    return <EpisodeTitle episode={episode} />;
  } else {
    return <>no episode found {episode_id}</>;
  }
};
