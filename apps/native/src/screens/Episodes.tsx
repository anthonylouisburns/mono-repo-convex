import React, { useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { styles } from '../component/Styles';
import { EverwhzHeader, } from '../component/EverwhzHeader';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { EpisodeView } from '../component/EpisodeView';
import { AudioContext } from '../../AudioContext'


const Episodes = ({ route, navigation }) => {
  const { isLoaded, } = useAuth();
  const { page, podcast_id, podcast_name } = route.params;


  const {
    set_podcast_id,
    set_player_podcast_name
  } = useContext(AudioContext);

  if (!isLoaded) {
    return null;
  }

  set_podcast_id(podcast_id)
  set_player_podcast_name(podcast_name)


  const episodes = useQuery(api.everwzh.episodes, { podcast_id: podcast_id as Id<"podcast"> })
  const itemView = episodes ? episodes.map((episode) => (
    <View style={styles.episode}>
      <EpisodeView episode_id={episode._id} podcast_name={podcast_name} longView={false} navigation={navigation} />
    </View>
  )) : []
  // todo https://rntp.dev/docs/basics/getting-started/



  return (
    <View style={styles.container}>

      <EverwhzHeader navigation={navigation} page="episodes" />
      <Text>{podcast_name}</Text>
      <ScrollView>
        {itemView}
      </ScrollView>

    </View>
  );
};



export default Episodes;
