import EverwhzHeader from "./components/EverwhzHeader";
import { Outlet } from "react-router-dom";
import PlayerHolder from "./components/player/PlayerHolder";
import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignIn } from "./components/signin/SignIn";

export type PlayerContext = {
  player_episode_id: string;
  set_player_episode_id: React.Dispatch<React.SetStateAction<string>>;
};

function App() {
  const [player_episode_id, set_player_episode_id] = useState<string>("");

  return (
    <div>
      <EverwhzHeader />
      <PlayerHolder playerEpisodeId={player_episode_id!} />
      <Authenticated>
        <Outlet context={{ player_episode_id, set_player_episode_id }} />
      </Authenticated>
      <Unauthenticated>
        <SignIn />
      </Unauthenticated>
    </div>
  );
}

export default App;
