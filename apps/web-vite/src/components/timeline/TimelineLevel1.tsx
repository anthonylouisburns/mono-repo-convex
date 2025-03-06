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
import { useState, useEffect } from "react";


const AccordionPage = ({ first, last, expandedPanel, updateExpandedPanel, pageSize, index, selectedOffset }: 
    { first: { timeline: Doc<"timeline">, offset: number }, last: { timeline: Doc<"timeline">, offset: number }, expandedPanel: string, updateExpandedPanel: (panel: string) => void, pageSize: Array<number>, index: number, selectedOffset: number }) => {
    
    useEffect(() => {
        if (selectedOffset>=first.offset && selectedOffset<last.offset) {
            updateExpandedPanel(first.timeline._id);
        }
    }, []); // Empty dependency array means run once on mount

    return (
        <Accordion
            key={first.timeline._id}
            expanded={expandedPanel === first.timeline._id}
            onChange={() => updateExpandedPanel(first.timeline._id)}>
            <AccordionSummary className={`${index % 2 === 0 ? 'bg-emerald-100' : 'bg-emerald-50'}`}>
                <div className="flex items-center justify-between w-full">
                    <span className="font-bold">
                        {first.timeline.start}-{last.timeline.start}
                    </span>
                </div>
            </AccordionSummary>
            {(expandedPanel === first.timeline._id) && (
                <AccordionDetails>
                    <TimelineLevel2 pageSize={pageSize} offset={first.offset} count={last.offset - first.offset} selectedOffset={selectedOffset}/>
                </AccordionDetails>
            )}
        </Accordion>

    );
};

export default function TimelineLevel1({ pageSize, selectedOffset }: { pageSize: Array<number>, selectedOffset: number }) {
    const [expandedPanel, setExpandedPanel] = useState("");
    const result = useQuery(api.page_timeline.getBookmarksAll, {
        pageSize: pageSize[0] * pageSize[1] * pageSize[2] * pageSize[3]
    });

    const { bookmarks = [] } = result ?? {};

    const pairs = []
    function updateExpandedPanel(panel: string) {
        if (expandedPanel === panel) {
            setExpandedPanel("");
        } else {
            setExpandedPanel(panel);
        }
    }
    for (let i = 0; i < bookmarks.length - 1; i += 1) {
        pairs.push({ first: bookmarks[i], last: bookmarks[i + 1], page: i })
    }
    return (
        <AccordionGroup className="w-full">
            {pairs.map((tl, index) => <AccordionPage key={index} first={tl.first} last={tl.last} expandedPanel={expandedPanel} updateExpandedPanel={updateExpandedPanel} pageSize={pageSize} index={index} selectedOffset={selectedOffset} />)}
        </AccordionGroup>
    );
};