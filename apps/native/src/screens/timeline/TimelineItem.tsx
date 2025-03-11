// import {
//   AccordionDetails,
//   AccordionSummary,
//   Accordion,
// } from "@mui/joy";
import React from 'react';
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { Doc } from "@packages/backend/convex/_generated/dataModel";
// import PlayArrowOutlined from "@mui/icons-material/PlayArrowOutlined";
import { useEffect } from "react";
import { View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { List } from 'react-native-paper';
import HTMLView from 'react-native-htmlview';
import { styles } from '../../component/Styles';
import { useNavigation, NavigationProp } from "@react-navigation/native";

export default function TimelineItem({ timeline_item, expandedPanel, updateExpandedPanel, index, selectedOffset, fistOffset, colors }: { timeline_item: Doc<"timeline">, expandedPanel: string, updateExpandedPanel: (panel: string) => void, index: number, selectedOffset: number, fistOffset: number, colors: Array<string> }) {
  const navigation = useNavigation<NavigationProp<any>>();
  const podcast = useQuery(api.everwhz.podcastTitle, {
    id: timeline_item.podcast_id,
  });
  const color = colors[index % colors.length];
  // const { set_player_episode_id } = useOutletContext<PlayerContext>();
  // const status = `${index}===${selectedOffset} ${expandedPanel}`
  const episode = useQuery(api.everwhz.episode, {
    id: timeline_item.episode_id,
  });
  useEffect(() => {
    // console.log("Effect running", { selectedOffset, index, status } ); // Debug log
    if ((selectedOffset - fistOffset) === index) {
      updateExpandedPanel(timeline_item._id);
    }
  }, [selectedOffset, index]); // Adding these deps to ensure initial values are caught

  if (!episode) {
    return null;
  }
  function selectEpisode() {
    // set_player_episode_id(timeline_item.episode_id);
  }
  const titleView = () => {
    return (
      <View>
        <Text>{timeline_item.start}</Text>
        {/* <TouchableWithoutFeedback> */}

        {/* </TouchableWithoutFeedback> */}
        <Text>{episode.title}</Text>
      </View>
    )
  }

  return (
    <View>
      <List.Accordion
        onPress={() => updateExpandedPanel(timeline_item._id)}
        expanded={expandedPanel === timeline_item._id}
        title={titleView()}
        style={{
          backgroundColor: color, // Alternating colors
        }}>
        <Text
          style={styles.link}
          key={timeline_item.podcast_id}
          onPress={(event: any) => {
            navigation.navigate("Episodes", {
              podcast_id: timeline_item.podcast_id,
              podcast_name: podcast.title,
            })
            event.stopPropagation();
          }}
        >
          {podcast.title}
        </Text>
        <HTMLView value={episode.episode_description ?? "-"} />
      </List.Accordion>
    </View >
  );
};
