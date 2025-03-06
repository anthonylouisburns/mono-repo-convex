import {
    AccordionDetails,
    AccordionSummary,
    Accordion,
    AccordionGroup,
} from "@mui/joy";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
import TimelineItem from "./TimelineItem";
import { Doc } from "@packages/backend/convex/_generated/dataModel";


const AccordionPage4 = ({ first, last, expandedPanel, updateExpandedPanel, index, selectedOffset }: { first: { timeline: Doc<"timeline">, offset: number }, last: { timeline: Doc<"timeline">, offset: number }, expandedPanel: string, updateExpandedPanel: (panel: string) => void, index: number, selectedOffset: number }) => {
    const count = last.offset - first.offset;
    const result = useQuery(api.page_timeline.pageOfTimeline, {
        pageSize: count,
        page: last.offset / count
    });
    const [expandedPanelEpisode, setExpandedPanelEpisode] = useState("");
    function updateExpandedPanelEpisode(panel: string) {
        if (expandedPanelEpisode === panel) {
            setExpandedPanelEpisode("");
        } else {
            setExpandedPanelEpisode(panel);
        }
    }
    useEffect(() => {
        if (selectedOffset>=first.offset && selectedOffset<last.offset) {
            updateExpandedPanel(first.timeline._id);
        }
    }, []); // Empty dependency array means run once on mount

    return (
        <Accordion key={first.timeline._id} expanded={expandedPanel===first.timeline._id} onChange={() => updateExpandedPanel(first.timeline._id)}>
            <AccordionSummary className={`${index % 2 === 0 ? 'bg-sky-100' : 'bg-sky-50'}`}>
                <div className="flex items-center justify-between w-full">
                    <span className="font-bold">
                        {first.timeline.start}-{last.timeline.start}
                    </span>
                </div>
            </AccordionSummary>
            {(expandedPanel===first.timeline._id) && (
                <AccordionDetails>
                    {result?.map((tl, index) => <TimelineItem key={index} timeline_item={tl} expandedPanel={expandedPanelEpisode} updateExpandedPanel={updateExpandedPanelEpisode} index={index} selectedOffset={selectedOffset} fistOffset={first.offset}/>)}
                </AccordionDetails>
            )}
        </Accordion>

    );
};
export default function TimelineLevel4({ pageSize, offset, count, selectedOffset }: { pageSize: Array<number>, offset: number, count: number, selectedOffset: number }) {
    const result = useQuery(api.page_timeline.getBookmarks, {
        pageSize: pageSize[3],
        offset: offset,
        count: count
    });
    const [expandedPanel, setExpandedPanel] = useState("");
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
            {pairs.map((tl, index) => <AccordionPage4 first={tl.first} last={tl.last} expandedPanel={expandedPanel} updateExpandedPanel={updateExpandedPanel} index={index} selectedOffset={selectedOffset}/>)}
        </AccordionGroup>
    );
};