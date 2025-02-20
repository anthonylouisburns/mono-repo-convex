"use client";

import Player from "./Player";
import { Id } from "@packages/backend/convex/_generated/dataModel";

export default function PlayerHolder({
  playerEpisodeId,
}: {
  playerEpisodeId: string;
}) {
  if (!playerEpisodeId || playerEpisodeId == "") {
    return <></>;
  }

  return <Player player_episode_id={playerEpisodeId as Id<"episode">} />;
}
