import EverwhzHeader from "./components/EverwhzHeader";
import { Outlet } from "react-router-dom";
import PlayerHolder from "./components/player/PlayerHolder";
import { useState } from "react";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignIn } from "./components/signin/SignIn";
import { AppBar, Toolbar } from "@mui/material";

export type PlayerContext = {
  player_episode_id: string;
  set_player_episode_id: React.Dispatch<React.SetStateAction<string>>;
};

function App() {
  const [player_episode_id, set_player_episode_id] = useState<string>("");

  return (
    <div>

      <AppBar>
        <Toolbar className="bg-emerald-50">
          <EverwhzHeader>
            <PlayerHolder playerEpisodeId={player_episode_id!} />
          </EverwhzHeader>
        </Toolbar>
      </AppBar>
      <Toolbar />
      <div className="pt-36">
        <Authenticated>
          <div className="padding-top-800">
            <Outlet context={{ player_episode_id, set_player_episode_id }} />
          </div>
        </Authenticated>
        <Unauthenticated>
          <SignIn />
        </Unauthenticated>
      </div>
    </div>
  );
}

export default App;
