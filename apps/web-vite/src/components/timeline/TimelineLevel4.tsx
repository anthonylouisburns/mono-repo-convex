import {
    AccordionGroup,
} from "@mui/joy";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import TimelineItem from "./TimelineItem";
import { useState } from "react";

export default function TimelineLevel4({ pageSize, offset }: { pageSize: number, offset: number }) {
    const [expandedPanel, setExpandedPanel] = useState("");
    const result = useQuery(api.page_timeline.pageOfTimeline, {
        pageSize: pageSize,
        page: offset / pageSize
    });
    function updateExpandedPanel(panel: string) {
        if (expandedPanel === panel) {
            setExpandedPanel("");
        } else {
            setExpandedPanel(panel);
        }
    }
    return (
        <AccordionGroup className="w-full">
            {result?.map((tl) => <TimelineItem timeline_item={tl} expandedPanel={expandedPanel} updateExpandedPanel={updateExpandedPanel} />)}
            {/* TimelinItem */}
        </AccordionGroup>
    );
};
