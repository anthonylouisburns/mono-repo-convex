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
import { Id } from '@packages/backend/convex/_generated/dataModel';
import HTMLView from 'react-native-htmlview';

const Episodes = ({ route, navigation }) => {
  const user = useUser();
  const imageUrl = user?.user?.imageUrl;
  const firstName = user?.user?.firstName;
  const { isLoaded, } = useAuth();
  const { page, podcast_id, podcast_name } = route.params;

  if (!isLoaded) {
    return null;
  }



  const episodes = useQuery(api.everwzh.episodes, { podcast_id: podcast_id as Id<"podcast"> })
  const itemView = episodes ? episodes.map((episode) => (
    <View style={styles.container}>
      <HTMLView value={episode?.body.title} />
    </View>
  )) : []




  return (
    <View style={styles.container}>

      <EverwhzHeader navigation={navigation} page="episodes" />
      <Text>{podcast_name}</Text>
      {itemView}

    </View>
  );
};



export default Episodes;
