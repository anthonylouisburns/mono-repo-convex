import {
    AccordionDetails,
    AccordionSummary,
    Accordion,
    AccordionGroup,
} from "@mui/joy";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import TimelineLevel4 from "./TimelineLevel4";


const AccordionPage3 = ({ first, last }: { first: { timeline: Doc<"timeline">, offset: number }, last: { timeline: Doc<"timeline">, offset: number } }) => {
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
                <TimelineLevel4 pageSize={10} offset={first.offset} />
            </AccordionDetails>
        </Accordion>

    );
};

export default function TimelineLevel3({ pageSize, offset, count }: { pageSize: number, offset: number, count: number }) {
    const result = useQuery(api.page_timeline.getBookmarks, {
        pageSize: pageSize,
        offset: offset,
        count: count
    });

    const { bookmarks = [] } = result ?? {};

    const pairs = []
    for (let i = 0; i < bookmarks.length - 1; i += 1) {
        pairs.push({ first: bookmarks[i], last: bookmarks[i + 1], page: i })
    }
    return (
        <AccordionGroup className="w-full">
            {pairs.map((tl) => <AccordionPage3 first={tl.first} last={tl.last} />)}
        </AccordionGroup>
    );
};