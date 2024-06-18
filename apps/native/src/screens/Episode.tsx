import { View, Text, TextInput, } from "react-native";
import { styles } from '../component/Styles';
import { EverwhzHeader, } from "../component/EverwhzHeader";
import { useAuth, } from '@clerk/clerk-expo';
// import TrackPlayer from 'react-native-track-player';
// https://rntp.dev/docs/basics/getting-started

//https://docs.expo.dev/versions/latest/sdk/audio/
import { useContext, useEffect } from 'react';
import { EpisodeView } from "../component/EpisodeView";
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { AudioContext } from '../../AudiContext'
import { Sound } from "expo-av/build/Audio";


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


// [ ] MINIMUM VIABLE PRODUCT
// [x]  play audio 
// [x]  scroll view - https://www.daily.co/blog/understanding-react-natives-flatlist-scrollview-and-sectionlist-components/
// [x] save user and email -  https://docs.convex.dev/auth/database-auth
// [x] web save user info https://docs.convex.dev/auth/database-auth
// [x] web navigation
// [x] keep track of play position - play history
// [ ] web play track
// [ ] WEB - delete unused code
// [ ] sort timeline
// [ ] add links from timeline to update edit box at top
// [x]  4. clean up delete unused code


// [ ] RELEASE
// [x] enroll as Apple Developer
// [ ]  check everything works - add tests
// [ ]  check everything in
// [ ] release - build EAS
// [ ] play in background - should work double check - continue play in background change tab - Expo Go app or Expo development build, the background audio mode will not work - https://dev.to/josie/how-to-add-background-audio-to-expo-apps-3fgc 
// [ ] tests
// [ ] daily back ups
// TO[ ]DO: development build


// [ ] NEW FEATURES
// [ ] AI suggestions
// [ ] add apple login
// [ ]  e. expand details - timeline expand contract
// [ ] use history
// [ ] paginated queries
// [ ] let podcast owner claim podcast - write instructions include public key



