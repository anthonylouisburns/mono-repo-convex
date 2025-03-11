import { styles } from "./Styles";
import { View, Text, ScrollView } from "react-native";
import HTMLView from "react-native-htmlview";
import { useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import React, { useContext } from "react";
import { AudioContext } from "../../AudioContext";
import { Button } from "react-native-paper";
export const EpisodeView = ({
  navigation,
  podcast_name,
  episode_id,
  longView,
}) => {
  const episode = useQuery(api.everwhz.episode, { id: episode_id });
  const {
    set_player_podcast_name,
    player_episode_id,
    set_player_episode_id,
    sound,
    setIsPlaying,
  } = useContext(AudioContext);

  async function selectSong() {
    console.log("selectSong start", podcast_name, episode.title);
    setIsPlaying(false);
    if (player_episode_id != episode._id && !(sound === undefined)) {
      await sound.stopAsync();
    }

    await set_player_episode_id(episode._id);
    await set_player_podcast_name(podcast_name);
    // setIsPlaying(false);
    // console.log("selectSong done", podcast_name, episode.title);
    // setIsPlaying(true);
  }

  if (!episode) {
    return <></>;
  }


  return (
    <View style={styles.container} key={episode_id}>
      <Button onPress={() => selectSong()} icon="play-outline" textColor="green">
        <HTMLView
          style={styles.dangerousTitle}
          value={`<div>${episode.title ?? "-"}</div>`}
        />
      </Button>
    </View>
  );
};
