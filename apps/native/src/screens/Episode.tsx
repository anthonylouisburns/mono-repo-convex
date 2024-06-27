import { View, Text, TextInput, } from "react-native";
import { styles } from '../component/Styles';
import { EverwhzHeader, } from "../component/EverwhzHeader";
import { useAuth, } from '@clerk/clerk-expo';
// import TrackPlayer from 'react-native-track-player';
// https://rntp.dev/docs/basics/getting-started

//https://docs.expo.dev/versions/latest/sdk/audio/
import { useContext } from 'react';
import { EpisodeView } from "../component/EpisodeView";
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { AudioContext } from '../../AudioContext'
import React from "react";


const Episode = ({ route, navigation, }) => {
    const { isLoaded, } = useAuth();
    const { episode_id, podcast_name } = route.params;

    const {
        set_player_podcast_name,
        player_episode_id,
        set_player_episode_id,
        sound,
        setIsPlaying
    } = useContext(AudioContext);

    const episode = useQuery(api.everwzh.episode, { id: episode_id });

    async function selectSong() {
        console.log("selectSong start")
        if(player_episode_id != episode_id && !(sound === undefined)){
            console.log("selectSong start 2", episode_id, episode._id, player_episode_id)
            await sound.stopAsync()
            setIsPlaying(false)
        }
        // console.log(player_episode_id != episode_id, " player_episode_id:", player_episode_id, " episode_id:", episode_id)

        await set_player_episode_id(episode._id);
        console.log("selectSong start 3")
        // console.log(" player_episode_id:", player_episode_id, " episode_id:", episode_id)
        // console.log("-----------")
        set_player_podcast_name(podcast_name);
        console.log("selectSong done")
    }




    if (!isLoaded) {
        return null;
    }

    return (
        <View style={styles.container}>
            <EverwhzHeader navigation={navigation} page="episode" />
            <View style={styles.container_center}>
                <Text style={styles.title}>{podcast_name}<Text style={styles.link} onPress={selectSong}>+</Text></Text>
                <EpisodeView episode_id={episode_id} longView={true} navigation={navigation} podcast_name={podcast_name} />
            </View>
        </View>
    );
}

export default Episode;

