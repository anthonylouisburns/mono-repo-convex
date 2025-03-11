
import React from 'react';
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { useState, useEffect } from "react";
import TimelineItem from "./TimelineItem";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
import { List } from "react-native-paper";
import { View, Text } from "react-native";
import { Accordion } from 'react-native-paper/lib/typescript/components/List/List';

const AccordionPage4 = ({ first, last, expandedPanel, updateExpandedPanel, index, selectedOffset, pageInfo }:
    { first: { timeline: Doc<"timeline">, offset: number }, last: { timeline: Doc<"timeline">, offset: number }, expandedPanel: string, updateExpandedPanel: (panel: string) => void, index: number, selectedOffset: number, pageInfo: Array<{ pageSize: number, color: Array<string> }>, }) => {
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
        if (selectedOffset >= first.offset && selectedOffset < last.offset) {
            updateExpandedPanel(first.timeline._id);
        }
    }, []); // Empty dependency array means run once on mount

    const color = pageInfo[3].color[index % pageInfo[3].color.length];
    return (
        <List.Accordion
            onPress={() => updateExpandedPanel(first.timeline._id)}
            expanded={expandedPanel === first.timeline._id}
            title={`${first.timeline.start ? first.timeline.start : "?"}-${last.timeline.start ? last.timeline.start : "?"}`}
            style={{
                backgroundColor: color, // Alternating colors
            }}
        >
            {result?.map((tl, index) => <TimelineItem key={index} timeline_item={tl} expandedPanel={expandedPanelEpisode} updateExpandedPanel={updateExpandedPanelEpisode} index={index} selectedOffset={selectedOffset} fistOffset={first.offset} colors={pageInfo[4].color} />)}
        </List.Accordion>
    );
};
export default function TimelineLevel4({ pageInfo, offset, count, selectedOffset }: { pageInfo: Array<{ pageSize: number, color: Array<string> }>, offset: number, count: number, selectedOffset: number }) {
    const result = useQuery(api.page_timeline.getBookmarks, {
        pageSize: pageInfo[3].pageSize,
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
        <>
            {pairs.map((tl, index) => <AccordionPage4 first={tl.first} last={tl.last} expandedPanel={expandedPanel} updateExpandedPanel={updateExpandedPanel} index={index} selectedOffset={selectedOffset} pageInfo={pageInfo} />)}
        </>
    );
};