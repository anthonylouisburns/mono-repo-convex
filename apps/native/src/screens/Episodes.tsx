import React, { useContext } from "react";
import { View, Text, ScrollView } from "react-native";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { styles } from "../component/Styles";
import { EverwhzHeader } from "../component/EverwhzHeader";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import { EpisodeView } from "../component/EpisodeView";

const Episodes = ({ route, navigation }) => {
  const { podcast_id, podcast_name } = route.params;
  const episodes = useQuery(api.everwhz.episodes, {
    podcast_id: podcast_id as Id<"podcast">,
  });
  const itemView = episodes
    ? episodes.map((episode) => (
        <View style={styles.episode} key={episode._id}>
          <EpisodeView
            episode_id={episode._id}
            podcast_name={podcast_name}
            longView={false}
            navigation={navigation}
          />
        </View>
      ))
    : [];
  // TODO https://rntp.dev/docs/basics/getting-started/

  return (
    <View style={styles.container}>
      <EverwhzHeader navigation={navigation} page="episodes" />
      <Text>{podcast_name}</Text>
      <ScrollView>{itemView}</ScrollView>
    </View>
  );
};

export default Episodes;
