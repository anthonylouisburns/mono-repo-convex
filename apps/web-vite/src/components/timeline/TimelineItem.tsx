import {
  AccordionDetails,
  AccordionSummary,
  Accordion,
} from "@mui/joy";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import { Link, useOutletContext } from "react-router-dom";
import { PlayerContext } from "../../App";

export default function TimelineItem({ timeline_item, expandedPanel, updateExpandedPanel }: { timeline_item: Doc<"timeline">, expandedPanel: string, updateExpandedPanel: (panel: string) => void }) {
  const podcast = useQuery(api.everwhz.podcastTitle, {
    id: timeline_item.podcast_id,
  });
  const { set_player_episode_id } = useOutletContext<PlayerContext>();

  const episode = useQuery(api.everwhz.episode, {
    id: timeline_item.episode_id,
  });
  if (!episode) {
    return null
  }

  function selectEpisode() {
    set_player_episode_id(timeline_item.episode_id);
  }

  return (
    <Accordion
      key={timeline_item._id}
      expanded={expandedPanel === timeline_item._id} // Only one open at a time
      onChange={() => updateExpandedPanel(timeline_item._id)}>
      <AccordionSummary className="bg-blue-50">
        <div className="flex items-center justify-between w-full">
          <span className="font-bold text-blue-700">
            {timeline_item.start}
          </span>
          <PlayArrowOutlined className="text-green-600" onClick={() => selectEpisode()} />
          <div className="flex items-center gap-2 flex-1 justify-center">
            <span className="truncate w-2/5 text-right">
              <span dangerouslySetInnerHTML={{ __html: podcast?.title ?? "" }} />
            </span>
            <span className="flex-shrink-0 text-center w-4">:</span>
            <span className="truncate w-3/5 text-left">
              <Link className="navigation-light" to={`/episode/${episode._id}`}>
                <span dangerouslySetInnerHTML={{ __html: episode.title ?? "" }} />
              </Link>
            </span>
          </div>
        </div>
      </AccordionSummary>
      <AccordionDetails>
        <div
          className="text-sm"
          dangerouslySetInnerHTML={{
            __html: episode.episode_description ?? "-",
          }}
        />
      </AccordionDetails>
    </Accordion>
  );
};