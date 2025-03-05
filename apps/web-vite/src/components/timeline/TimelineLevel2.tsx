import {
    AccordionDetails,
    AccordionSummary,
    Accordion,
    AccordionGroup,
} from "@mui/joy";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import TimelineLevel3 from "./TimelineLevel3";
import { useState } from "react";


const AccordionPage2 = ({ first, last, expandedPanel, updateExpandedPanel }: { first: { timeline: Doc<"timeline">, offset: number }, last: { timeline: Doc<"timeline">, offset: number }, expandedPanel: string, updateExpandedPanel: (panel: string) => void }) => {

    return (
        <Accordion key={first.timeline._id} expanded={expandedPanel===first.timeline._id} onChange={() => updateExpandedPanel(first.timeline._id)}>
            <AccordionSummary className="bg-blue-100">
                <div className="flex items-center justify-between w-full">
                    <span className="font-bold">
                        {first.timeline.start}-{last.timeline.start}
                    </span>
                </div>
            </AccordionSummary>
            {(expandedPanel===first.timeline._id) && (
                <AccordionDetails>
                    <TimelineLevel3 pageSize={10} offset={first.offset} count={last.offset - first.offset} />
                </AccordionDetails>
            )}
        </Accordion>

    );
};

export default function TimelineLevel2({ pageSize, offset, count }: { pageSize: number, offset: number, count: number }) {
    const [expandedPanel, setExpandedPanel] = useState("");
    const result = useQuery(api.page_timeline.getBookmarks, {
        pageSize: pageSize,
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
            {pairs.map((tl) => <AccordionPage2 first={tl.first} last={tl.last} expandedPanel={expandedPanel} updateExpandedPanel={updateExpandedPanel}/>)}
        </AccordionGroup>
    );
};