import React, { useContext } from "react";
import { View, Text, ScrollView } from "react-native";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { styles } from "../component/Styles";
import { EverwhzHeader } from "../component/EverwhzHeader";
import { Doc, Id } from "@packages/backend/convex/_generated/dataModel";
import { EpisodeView } from "../component/EpisodeView";
import { List } from "react-native-paper";
import HTMLView from "react-native-htmlview";

const Episodes = ({ route, navigation }) => {
  const { podcast_id, podcast_name } = route.params;
  const episodes = useQuery(api.everwhz.episodes, {
    podcast_id: podcast_id as Id<"podcast">,
  });  
  const podcast = useQuery(api.everwhz.podcastTitle, {
    id: podcast_id as Id<"podcast">,
  });
  

  const itemView = episodes
    ? episodes.map((episode) => (
        <View style={styles.episode} key={episode._id}>
          <EpisodeView
            episode_id={episode._id}
            podcast_name={podcast_name}
            navigation={navigation}
          />
        </View>
      ))
    : [];

  return (
    <View style={styles.container}>
      <EverwhzHeader navigation={navigation} page="episodes" />
      <List.Accordion title={podcast_name}>
        <ScrollView>
          <HTMLView value={podcast.description ?? "-"} />
        </ScrollView>
      </List.Accordion>
      <ScrollView>{itemView}</ScrollView>
    </View>
  );
};

export default Episodes;
