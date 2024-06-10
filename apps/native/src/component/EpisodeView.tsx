import { styles } from "./EverwhzHeader"
import {
    View,
    Text,
} from 'react-native';
import HTMLView  from 'react-native-htmlview';
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';

export const EpisodeView = ({ episode_id }) => {
    const episode =  useQuery(api.everwzh.episode, {id: episode_id});

    if (!episode) {
        return (
            <>
            </>
        )
    }
    return (
        <View style={styles.container} key={episode_id}>
            <HTMLView value={episode?.body.title} />
            {/* <Text>{JSON.stringify(episode?.body.enclosure["@_url"])}</Text> */}
        </View>
    )
}
