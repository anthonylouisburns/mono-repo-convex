"use client";

import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { Link, useOutletContext } from "react-router-dom";
import { PlayerContext } from "../../App";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";

export const EpisodeTitle = function Episode({
  episode,
}: {
  episode: Doc<"episode">;
}): JSX.Element {
  const { set_player_episode_id } = useOutletContext<PlayerContext>();
  const title: string = episode.title ? episode.title : "title not set";
  const offset = useQuery(api.page_timeline.indexOfEpisode, { episode_id: episode._id });

  function selectEpisode() {
    set_player_episode_id(episode._id);
  }

  return (
    <div>
      {/* <Link className="navigation-light" to={"/episode/" + episode._id}> */}
      <div className="flex items-center gap-2">
        <PlayArrowOutlined className="text-green-600" onClick={() => selectEpisode()} />
        
        {offset !== null ? (
                <Link className="navigation-light" to={`/timeline?index=${offset}`}>
                    <div dangerouslySetInnerHTML={{ __html: title }} />
                </Link>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: title }} />
            )}
      </div>
      {/* </Link> */}
      {/* <TimeSpans spans={timespans} podcast_id={episode.podcast_id} episode_id={episode._id} /> */}
    </div>
  );
};
