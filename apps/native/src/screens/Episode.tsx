import { View, Text, TextInput, } from "react-native";
import { EverwhzHeader, styles } from "../component/EverwhzHeader";
import { useAuth, useUser } from '@clerk/clerk-expo';
// import TrackPlayer from 'react-native-track-player';
// https://rntp.dev/docs/basics/getting-started

//https://docs.expo.dev/versions/latest/sdk/audio/
import { useContext } from 'react';
import { EpisodeView } from "../component/EpisodeView";
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { AudioContext } from '../../AudiContext'


const Episode = ({ route, navigation }) => {
    const { isLoaded, } = useAuth();
    const params = route.params;
    const this_episode_id = params["episode_id"]
    const this_podcast_name = params["podcast_name"]

    const {
        sound,
        episode_id,
        set_episode_id,
        set_podcast_name,
        set_duration,
        set_position
    } = useContext(AudioContext);

    const episode = useQuery(api.everwzh.episode, { id: this_episode_id });


    async function selectSong() {
        if (episode_id != this_episode_id) {
            set_episode_id(episode._id);
            set_podcast_name(this_podcast_name);
            set_position("-");
            set_duration("-");
            sound.stopAsync();
        }
    }



    if (!isLoaded) {
        return null;
    }

    return (
        <View style={styles.container}>
            <EverwhzHeader navigation={navigation} page="player" />
            <View style={styles.container_center}>
                <Text style={styles.title}>{this_podcast_name}</Text>
                <EpisodeView episode_id={this_episode_id} longView={true} navigation={navigation}/>
                <Text style={styles.link} onPress={selectSong}>+</Text>
            </View>


        </View>
    );
}

export default Episode;

// TODO
// 1. check everything works
// 2. check everything in
// 3. play audio
// a. continue play in background change tab
// b. scroll view
// c. return to player
// d. keep track of play position
// e. expand details
// ....
// 4. clean up delete unused code
// 5. release