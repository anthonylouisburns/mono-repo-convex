import React from 'react';
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

const Podcasts = ({ navigation }) => {
  const { isLoaded, signOut } = useAuth();
  const podcasts = useQuery(api.everwzh.podcasts);

  if (!isLoaded) {
    return null;
  }


  const podcastsView = podcasts ? podcasts.map((podcast) => (
    <Text style={styles.link}
      onPress={() =>
        navigation.navigate('Episodes', { podcast_id: podcast._id, podcast_name: podcast.name })
      }
      key={podcast._id}
    >{podcast.name}</Text>
  )) : []

  return (
    <View style={styles.container}>
      <EverwhzHeader navigation={navigation} page="podcast" />
      <ScrollView>
        <Text>{podcastsView}</Text>
      </ScrollView>
    </View>
  );
};

export default Podcasts;
