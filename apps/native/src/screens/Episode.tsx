import { View, Text, TextInput, } from "react-native";
import { styles } from '../component/Styles';
import { EverwhzHeader, } from "../component/EverwhzHeader";
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

    if(!episode_id){
        set_episode_id(this_episode_id)
        set_podcast_name(this_podcast_name)
    }

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
            <EverwhzHeader navigation={navigation} page="episode" />
            <View style={styles.container_center}>
                <Text style={styles.title}>{this_podcast_name}<Text style={styles.link} onPress={selectSong}>+</Text></Text>
                <EpisodeView episode_id={this_episode_id} longView={true} navigation={navigation} podcast_name={this_podcast_name} />
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
// [ ] keep track of play position - play history
// [ ] web play track
// [ ] WEB - delete unused code
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
// [ ] add apple login
// [ ]  e. expand details - timeline expand contract
// [ ] use history
// [ ] paginated queries
// [ ] let podcast owner claim podcast - write instructions include public key



