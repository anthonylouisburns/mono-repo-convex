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
import { useState } from "react";

const AccordionPage3 = ({ first, last, expandedPanel, updateExpandedPanel, pageSize, index }: { first: { timeline: Doc<"timeline">, offset: number }, last: { timeline: Doc<"timeline">, offset: number }, expandedPanel: string, updateExpandedPanel: (panel: string) => void, pageSize: Array<number>, index: number }) => {
    
    return (
        <Accordion key={first.timeline._id} expanded={expandedPanel===first.timeline._id} onChange={() => updateExpandedPanel(first.timeline._id)}>
            <AccordionSummary className={`${index % 2 === 0 ? 'bg-rose-100' : 'bg-rose-50'}`}>
                <div className="flex items-center justify-between w-full">
                    <span className="font-bold">
                        {first.timeline.start}-{last.timeline.start}
                    </span>
                </div>
            </AccordionSummary>
            {(expandedPanel===first.timeline._id) && (
                <AccordionDetails>
                    <TimelineLevel4 pageSize={pageSize} offset={first.offset} count={last.offset - first.offset} />
                </AccordionDetails>
            )}
        </Accordion>

    );
};

export default function TimelineLevel3({ pageSize, offset, count }: { pageSize: Array<number>, offset: number, count: number }) {
    const [expandedPanel, setExpandedPanel] = useState("");
    const result = useQuery(api.page_timeline.getBookmarks, {
        pageSize: pageSize[2] * pageSize[3],
        offset: offset,
        count: count
    });
    function updateExpandedPanel(panel: string) {
        if (expandedPanel === panel) {
            setExpandedPanel("");
        } else {
            setExpandedPanel(panel);
        }
    }
    const { bookmarks = [] } = result ?? {};

    const pairs = []
    for (let i = 0; i < bookmarks.length - 1; i += 1) {
        pairs.push({ first: bookmarks[i], last: bookmarks[i + 1], page: i })
    }
    return (
        <AccordionGroup className="w-full">
            {pairs.map((tl, index) => <AccordionPage3 key={index} first={tl.first} last={tl.last} expandedPanel={expandedPanel} updateExpandedPanel={updateExpandedPanel} pageSize={pageSize} index={index}/>)}
        </AccordionGroup>
    );
};