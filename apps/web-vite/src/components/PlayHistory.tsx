import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { ListItem } from "@mui/joy";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { msToTime } from "../lib/utilities";
import { Link, useOutletContext } from "react-router-dom";
import { PlayerContext } from "../App";

import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import List from '@mui/joy/List';

export const EpisodePlayed = function EpisodePlayed({ episode_id, position }: { episode_id: Id<"episode">, position: number }) {
    const episode = useQuery(api.everwhz.episode, { id: episode_id });
    const offset = useQuery(api.page_timeline.indexOfEpisode, { episode_id: episode_id });
    const { set_player_episode_id } = useOutletContext<PlayerContext>();
    function selectEpisode() {
        set_player_episode_id(episode_id);
    }
    return (
        <ListItem>
            <PlayArrowOutlined className="text-green-600" onClick={() => selectEpisode()} />
            {episode?.podcast_id &&
                <Link className="navigation-dark" to={`/episodes/${episode.podcast_id}`}>
                    <span dangerouslySetInnerHTML={{ __html: episode?.podcast_title ?? "" }} />:
                </Link>
            }
            <Link className="navigation-light" to={`/timeline?index=${offset}`}>
                <span dangerouslySetInnerHTML={{ __html: episode?.title ?? "" }} />
            </Link> - {msToTime(position)}
        </ListItem>
    )
}

export default function PlayHistory() {
    const playHistory = useQuery(api.everwhz.getPlayStatusHistory, {});

    return (

        <List className="w-full">
            {playHistory?.map((play_status) => <EpisodePlayed episode_id={play_status.episode_id} position={play_status.position} />)}
        </List>

    );
}
