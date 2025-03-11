import { View, Text, TextInput, Button } from "react-native";
import { styles } from "./Styles";
import { useContext, useEffect, useState } from "react";
import { AVPlaybackStatus, Audio } from "expo-av";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { AudioContext } from "../../AudioContext";
import { Id } from "@packages/backend/convex/_generated/dataModel";
import HTMLView from "react-native-htmlview";
import { msToTime, timeToMs } from "../lib/utilities";
import React from "react";
import * as Application from "expo-application";
import { Platform } from "react-native";
import { IconButton } from "react-native-paper";
import DropDownPicker from "react-native-dropdown-picker";
import { PlayerContext } from "../../PlayerContext";

const Player = () => {
  const UPDATE_DELAY_SECONDS = 5;
  const [lastUpdatePos, setLastUpdatePos] = useState(0);
  const { isLoading } = useConvexAuth();

  const {
    deviceId,
    episodePlayingId,
    setEpisodePlayingId,
    setPodcastPlayingId,
  } = useContext(PlayerContext);

  const episode = useQuery(api.everwhz.episode, {
    id: episodePlayingId ?? undefined,
  });

  const set_play_status = useMutation(api.everwhz.playStatus);

  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const [position, setPosition] = useState(msToTime(0));
  const [duration, setDuration] = useState(msToTime(0));
  const [dropdownValue, setDropdownValue] = useState("timeline");
  const [open, setOpen] = useState(false);
  const dropDownOptions = [
    { label: "timeline", value: "timeline" },
    { label: "timeline shuffle", value: "timeline-shuffle" },
    { label: "podcast", value: "podcast" },
    { label: "podcast shuffle", value: "podcast-shuffle" },
  ];

  function updatePlayStatus(playbackStatus: AVPlaybackStatus) {
    if (!playbackStatus.isLoaded) {
      // Update your UI for the unloaded state
      if (playbackStatus["error"]) {
        console.log(
          `Encountered a fatal error during playback: ${playbackStatus["error"]}`,
        );
        // Send Expo team the error on Slack or the forums so we can help you debug!
      }
    } else {
      if (playbackStatus.isPlaying) {
        const pos = playbackStatus.positionMillis;
        if (pos - timeToMs(position) > 1000) {
          setPosition(msToTime(pos));
          if (Math.abs(pos - lastUpdatePos) > UPDATE_DELAY_SECONDS * 1000) {
            set_play_status({ id: episodePlayingId, position: pos, device_id: deviceId });
            setLastUpdatePos(pos);
          }
        }
      }
    }
  }

  // useEffect(() => {
  //   if (!sound || ) {
  //     const new_position = getPlayStatus ? getPlayStatus.position : 0;
  //     setPosition(msToTime(new_position));
  //     console.log("useEffect 2");
  //   }
  //   if (sound && !isPlaying) {
  //     const new_position = getPlayStatus ? getPlayStatus.position : 0;
  //     sound.setPositionAsync(new_position);
  //   }
  // }, [getPlayStatus]);

  useEffect(() => {
    sound?.unloadAsync();
    if (episodePlayingId == null) {
      setSound(null);
      setPodcastPlayingId(null);
    } 
    if (episodePlayingId) {
      setPodcastPlayingId(episode.podcast_id);
    }
    loadSound();
    // stopSound();
    // const new_position =  getPlayStatus ? getPlayStatus.position : 0;
    // setPosition(msToTime(new_position));
    // playSound();
  }, [episodePlayingId]);

  async function loadSound() {
    const mp3_link = episode.mp3_link;
    const source = { uri: mp3_link };
    const getPlayStatus = useQuery(api.everwhz.getPlayStatus, {
      id: episodePlayingId,
      device_id: deviceId,
    });
    const positionMillis = getPlayStatus ? getPlayStatus.position : 0;

    const { sound, status } = await Audio.Sound.createAsync(source, { positionMillis: positionMillis }, updatePlayStatus);
    setDuration(msToTime(status["durationMillis"]));
    setSound(sound);
  }

  async function playSound() {
    await sound?.playAsync();
  }

  async function stopSound() {
    sound?.stopAsync();
  }

  async function skip(seconds: number) {
    //   sound.setPositionAsync(timeToMs(position) + (seconds * 1000));
    //   setPosition(msToTime(timeToMs(position) + (seconds * 1000)));
  }

  function playNext() {
    //   sound.setPositionAsync(1000);
    //   setPosition(msToTime(1000));
  }

  if (isLoading || !episodePlayingId) {
    return <></>;
  }

  return (
    <View style={styles.player_center}>
      <View style={styles.player}>
        <Text style={{ marginTop: 5, fontWeight: "bold" }}>{episode.podcast_name}</Text>
      </View>
      <View style={styles.player}>
        <HTMLView value={episode.title ?? "-"} />
        <IconButton icon="close" onPress={() => setEpisodePlayingId(null)} />
      </View>
      <View style={styles.player}>
        <IconButton iconColor="green" icon="rewind-30" onPress={() => skip(-30)} style={{ margin: -5, padding: 0 }} />
        <IconButton iconColor="green" icon="pause-circle-outline" onPress={stopSound} style={{ margin: -5, padding: 0 }} />
        <Text style={{ marginTop: 5 }}>{position} / {duration}</Text>
        <IconButton iconColor="green" icon="play-outline" onPress={playSound} style={{ margin: -5, padding: 0 }} />
        <IconButton iconColor="green" icon="fast-forward-60" onPress={() => skip(60)} style={{ margin: -5, padding: 0 }} />
      </View>
      <View style={styles.player}>
        <IconButton
          iconColor="green"
          icon="skip-previous-outline"
          onPress={() => playNext()}
          style={{ margin: -5, padding: 0 }} />
        <View>
          <DropDownPicker
            value={dropdownValue}
            setValue={(value) => setDropdownValue(value)}
            items={dropDownOptions}
            multiple={false}
            open={open}
            setOpen={setOpen}
            style={{ backgroundColor: "light-grey", width: 110, borderWidth: 0, margin: -10 }}
          />
        </View>
        <IconButton
          iconColor="green"
          icon="skip-next-outline"
          onPress={() => playNext()}
          style={{ margin: -5, padding: 0 }} />
      </View>
    </View>
  );
};

export default Player;


// useEffect(() => {
//   getDeviceId().then((id) => setDeviceId(id));
// }, []);
// useEffect(() => {
//   Audio.setAudioModeAsync({
//     staysActiveInBackground: true,
//     playsInSilentModeIOS: true,
//     interruptionModeIOS: InterruptionModeIOS.DoNotMix,
//     interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
//     shouldDuckAndroid: true,
//     playThroughEarpieceAndroid: true,
//   });
//   return sound
//     ? () => {
//       console.log("Unloading Sound");
//       sound.unloadAsync();
//     }
//     : undefined;
// }, [sound]);