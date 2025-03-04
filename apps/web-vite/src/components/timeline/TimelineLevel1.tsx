import {
    AccordionDetails,
    AccordionSummary,
    Accordion,
    AccordionGroup,
} from "@mui/joy";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import TimelineLevel2 from "./TimelineLevel2";


const AccordionPage = ({ first, last }: { first: { timeline: Doc<"timeline">, offset: number }, last: { timeline: Doc<"timeline">, offset: number } }) => {
    return (
        <Accordion>
            <AccordionSummary>
                <div className="flex items-center justify-between w-full">
                    <span className="font-bold">
                        {first.timeline.start}-{last.timeline.start}
                    </span>
                </div>
            </AccordionSummary>
            <AccordionDetails>
                <TimelineLevel2 pageSize={100} offset={first.offset} count={last.offset - first.offset} />
            </AccordionDetails>
        </Accordion>

    );
};

export default function TimelineLevel1({ pageSize }: { pageSize: number }) {
    const result = useQuery(api.page_timeline.getBookmarksAll, {
        pageSize: pageSize
    });

    const { bookmarks = [] } = result ?? {};

    const pairs = []
    for (let i = 0; i < bookmarks.length - 1; i += 1) {
        pairs.push({ first: bookmarks[i], last: bookmarks[i + 1], page: i })
    }
    return (
        <AccordionGroup className="w-full">
            {pairs.map((tl) => <AccordionPage first={tl.first} last={tl.last} />)}
        </AccordionGroup>
    );
};