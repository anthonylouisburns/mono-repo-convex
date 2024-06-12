import { styles } from './Styles';
import {
    View,
    Text,
    ScrollView
} from 'react-native';
import HTMLView from 'react-native-htmlview';
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';

export const EpisodeView = ({ navigation, podcast_name, episode_id, longView }) => {
    const episode = useQuery(api.everwzh.episode, { id: episode_id });

    if (!episode) {
        return (
            <>
            </>
        )
    }
    function details() {
        if (longView) {
            return (
                <HTMLView value={episode?.body["content:encoded"]} />
            )
        }
        return (<></>)
    }
    return (
        <View style={styles.container} key={episode_id}>

            <Text style={styles.link} onPress={() => {
                navigation.navigate('Episode', { podcast_name: podcast_name, episode_id: episode._id })
            }}><HTMLView value={episode?.body.title} /></Text>
            <ScrollView>
                {details()}
            </ScrollView>
        </View>
    )
}
