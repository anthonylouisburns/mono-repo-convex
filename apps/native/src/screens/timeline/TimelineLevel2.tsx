import React from "react";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import TimelineLevel3 from "./TimelineLevel3";
import { useEffect, useState } from "react";
import { List } from "react-native-paper";


const AccordionPage2 = ({ first, last, expandedPanel, updateExpandedPanel, pageInfo, index, selectedOffset }: { first: { timeline: Doc<"timeline">, offset: number }, last: { timeline: Doc<"timeline">, offset: number }, expandedPanel: string, updateExpandedPanel: (panel: string) => void, pageInfo: Array<{ pageSize: number, color: Array<string> }>, index: number, selectedOffset: number }) => {

    useEffect(() => {
        if (selectedOffset >= first.offset && selectedOffset < last.offset) {
            updateExpandedPanel(first.timeline._id);
        }
    }, []); // Empty dependency array means run once on mount

    const color = pageInfo[1].color[index % pageInfo[0].color.length];
    return (
        <List.Accordion
            onPress={() => updateExpandedPanel(first.timeline._id)}
            expanded={expandedPanel === first.timeline._id}
            title={`${first.timeline.start ? first.timeline.start : "?"}-${last.timeline.start ? last.timeline.start : "?"}`}
            style={{
                backgroundColor: color, // Alternating colors
            }}
        >
            <TimelineLevel3 pageInfo={pageInfo} offset={first.offset} count={last.offset - first.offset} selectedOffset={selectedOffset} />
        </List.Accordion>

    );
};

export default function TimelineLevel2({ pageInfo, offset, count, selectedOffset }: { pageInfo: Array<{ pageSize: number, color: Array<string> }>, offset: number, count: number, selectedOffset: number }) {
    const [expandedPanel, setExpandedPanel] = useState("");
    const result = useQuery(api.page_timeline.getBookmarks, {
        pageSize: pageInfo[1].pageSize * pageInfo[2].pageSize * pageInfo[3].pageSize,
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
        <List.Section>
            {pairs.map((tl, index) => <AccordionPage2 key={index} first={tl.first} last={tl.last} expandedPanel={expandedPanel} updateExpandedPanel={updateExpandedPanel} pageInfo={pageInfo} index={index} selectedOffset={selectedOffset} />)}
        </List.Section>
    );
};