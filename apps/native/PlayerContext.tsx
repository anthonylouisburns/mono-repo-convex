import { createContext } from "react";
import { Id } from "@packages/backend/convex/_generated/dataModel";

type PlayerContextType = {
    deviceId: string;
    episodePlayingId: Id<"episode"> | null;
    setEpisodePlayingId: (id: Id<"episode"> | null) => void;
    podcastPlayingId: Id<"podcast"> | null;
    setPodcastPlayingId: (id: Id<"podcast"> | null) => void;
};

export const PlayerContext = createContext<PlayerContextType>({
    deviceId: "",
    episodePlayingId: null,
    setEpisodePlayingId: () => {},
    podcastPlayingId: null,
    setPodcastPlayingId: () => {},
});
