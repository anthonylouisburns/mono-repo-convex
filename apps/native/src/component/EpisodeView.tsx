import { styles } from "./EverwhzHeader"
import {
    View,
    Text,
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
            <HTMLView value={episode?.body.title}  />
            {details()}
        </View>
    )
}
