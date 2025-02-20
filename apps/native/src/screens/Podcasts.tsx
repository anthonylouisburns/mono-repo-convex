import React from "react";
import { View, Text, ScrollView } from "react-native";
import { api } from "@packages/backend/convex/_generated/api";
import { useQuery } from "convex/react";
import { styles } from "../component/Styles";
import { EverwhzHeader } from "../component/EverwhzHeader";

const Podcasts = ({ navigation }) => {
  const podcasts = useQuery(api.everwhz.podcasts);

  const podcastsView = podcasts
    ? podcasts.map((podcast) => (
        <View style={styles.container}>
          <Text
            style={styles.link}
            onPress={() =>
              navigation.navigate("Episodes", {
                podcast_id: podcast._id,
                podcast_name: podcast.title,
              })
            }
            key={podcast._id}
          >
            {podcast.title}
          </Text>
        </View>
      ))
    : [];

  return (
    <View style={styles.container}>
      <EverwhzHeader navigation={navigation} page="podcast" />
      <ScrollView>{podcastsView}</ScrollView>
    </View>
  );
};

export default Podcasts;
