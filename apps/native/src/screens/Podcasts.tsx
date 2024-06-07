import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { EverwhzHeader, styles } from '../component/EverwhzHeader';

const Timeline = ({ navigation }) => {
  const user = useUser();
  const imageUrl = user?.user?.imageUrl;
  const firstName = user?.user?.firstName;
  const { isLoaded, signOut } = useAuth();
  const podcasts = useQuery(api.everwzh.podcasts);

  if (!isLoaded) {
    return null;
  }


  const podcastsView = podcasts ? podcasts.map((podcast) => (
    <Text style={styles.link}
      onPress={() =>
        navigation.navigate('Episodes', { page: "episodes", podcast_id: podcast._id, podcast_name: podcast.name })
      }
    >{podcast.name}</Text>
  )) : []
  // navigate("HeaderStack",{},
  //   {
  //     type: "Navigate",
  //     routeName: "SecondView",
  //     params: {name:"Jo"}
  //   }
  return (
    <View style={styles.container}>
      <EverwhzHeader navigation={navigation} page="podcast" />
      <Text>{podcastsView}</Text>
    </View>
  );
};

export default Timeline;
