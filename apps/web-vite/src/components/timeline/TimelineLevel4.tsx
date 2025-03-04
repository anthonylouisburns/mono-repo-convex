import {
    AccordionGroup,
} from "@mui/joy";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import TimelineItem from "./TimelineItem";


export default function TimelineLevel4({ pageSize, offset }: { pageSize: number, offset: number }) {
    const result = useQuery(api.page_timeline.pageOfTimeline, {
        pageSize: pageSize,
        page: offset / pageSize
    });

    return (
        <AccordionGroup className="w-full">
            {result?.map((tl) => <TimelineItem timeline_item={tl} />)}
            {/* TimelinItem */}
        </AccordionGroup>
    );
};
