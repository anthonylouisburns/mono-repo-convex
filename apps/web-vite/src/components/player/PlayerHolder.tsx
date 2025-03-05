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
// [ ] change progress in player
// [ ] figure out sound issue
// [ ] update timeline and aggregate 
// [ ] add counts to timeline
// [ ] filters
// [ ] save timeline
// [ ] play next episode in timeline
