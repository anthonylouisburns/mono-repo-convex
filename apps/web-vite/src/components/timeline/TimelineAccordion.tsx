import {
  AccordionDetails,
  AccordionSummary,
  Accordion,
  AccordionGroup,
} from "@mui/joy";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import { Link } from "react-router-dom";

export default function TimelineAccordion() {
  const timeline = useQuery(
    api.everwhz.getTimeline,
  );
  //TODO just this view
  //[x] PLAYER
  //[ ] player show previous and next episode (with play button)
  //[ ] someway to show podcast info
  //[ ] save users status in all episodes
  //[ ] database unified playlist - first_year, last_year, podcast_id, episode_id, tags?
  //---
  //[ ] just this view on app - maybe try flutter
  //--- 
  //[ ] palette colors for title by podcast
  //[ ] 15 per page
  //[ ] save users filters
  //[ ] filters

  //[ ] todo component above accordion to show podcast info - has x to close, and title and description, only show if podcast selected
  const AccordionItem = ({ timeline_item }: { timeline_item: Doc<"timeline"> }) => {
    const podcast = useQuery(api.everwhz.podcastTitle, {
      id: timeline_item.podcast_id,
    });

    const episode = useQuery(api.everwhz.episode, {
      id: timeline_item.episode_id,
    });
    if(!episode){
      return null
    }
    return (
      <Accordion>
        <AccordionSummary>
          <div className="flex items-center justify-between w-full">
            <span className="font-bold">
              {timeline_item.start}
            </span>
            <PlayArrowOutlined className="text-green-600" />
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
              __html: episode.body?.description ?? "",
            }}
          />
        </AccordionDetails>
      </Accordion>
    );
  };
  return (
    <div>
      <AccordionGroup className="w-full">
        {timeline?.map((timeline_item) => <AccordionItem timeline_item={timeline_item} />)}
      </AccordionGroup>
    </div>
  );
}
