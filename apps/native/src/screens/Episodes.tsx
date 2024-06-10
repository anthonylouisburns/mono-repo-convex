import React from 'react';
import {
  View,
  Text,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { EverwhzHeader, styles } from '../component/EverwhzHeader';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { EpisodeView } from '../component/EpisodeView';


const Episodes = ({ route, navigation }) => {
  const user = useUser();
  const { isLoaded, } = useAuth();
  const { page, podcast_id, podcast_name } = route.params;

  if (!isLoaded) {
    return null;
  }



  const episodes = useQuery(api.everwzh.episodes, { podcast_id: podcast_id as Id<"podcast"> })
  const itemView = episodes ? episodes.map((episode) => (
    <>
      <Text style={styles.link} onPress={() => {
        navigation.navigate('Episode', { page: "player", podcast_name: podcast_name, episode_id: episode._id })
      }}>{">"}</Text>
      <EpisodeView episode_id={episode._id} />
    </>
  )) : []
  // todo https://rntp.dev/docs/basics/getting-started/



  return (
    <View style={styles.container}>

      <EverwhzHeader navigation={navigation} page="episodes" />
      <Text>{podcast_name}</Text>
      {itemView}

    </View>
  );
};



export default Episodes;
