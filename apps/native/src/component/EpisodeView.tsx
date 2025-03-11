import { styles } from "./Styles";
import { View, Text, ScrollView } from "react-native";
import HTMLView from "react-native-htmlview";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import React, { useContext } from "react";
import { Button } from "react-native-paper";
import { PlayerContext } from "../../PlayerContext";

export const EpisodeView = ({
  navigation,
  podcast_name,
  episode_id,
}) => {
  const episode = useQuery(api.everwhz.episode, { id: episode_id });
  const {
    setEpisodePlayingId
  } = useContext(PlayerContext);

  async function selectEpisode() {
    console.log("selectSong start", podcast_name, episode.title);
    setEpisodePlayingId(episode_id);
  }

  if (!episode) {
    return <></>;
  }


  return (
    <View style={styles.container} key={episode_id}>
      <Button onPress={() => selectEpisode()} icon="play-outline" textColor="green">
        <HTMLView
          style={styles.dangerousTitle}
          value={`<div>${episode.title ?? "-"}</div>`}
        />
      </Button>
    </View>
  );
};
