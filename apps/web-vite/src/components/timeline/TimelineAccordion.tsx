import { AccordionDetails, AccordionSummary, Accordion } from '@mui/joy';
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery } from "convex/react";
import { Doc } from '@packages/backend/convex/_generated/dataModel';
export default function TimelineAccordion() {
    const episodes = useQuery(api.everwhz.getEpisodesWithYears);
    //TODO just this view
    const AccordionItem = ({ episode }: { episode: Doc<"episode"> }) => {
        const podcast_title = useQuery(api.everwhz.podcastTitle, { id: episode.podcast_id });
        return (
            <Accordion>
                <AccordionSummary>
                    <div className="flex items-center justify-between w-full">
                        <span className="font-bold">{episode.years?.[0] ?? "Unknown Year"}</span>
                        <div className="flex items-center gap-2 flex-1 justify-center">
                            <span className="truncate w-2/5 text-right">{podcast_title}</span>
                            <span className="flex-shrink-0 text-center w-4">:</span>
                            <span className="truncate w-3/5 text-left">{episode.title}</span>
                        </div>
                    </div>
                </AccordionSummary>
                <AccordionDetails>
                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: episode.body?.description ?? '' }} />
                </AccordionDetails>
            </Accordion>
        )
    }
    return (
        <div>
            <div className="w-full">
                {episodes?.map((episode) => (
                    <AccordionItem episode={episode} />
                ))}
            </div>
        </div>
    )
}