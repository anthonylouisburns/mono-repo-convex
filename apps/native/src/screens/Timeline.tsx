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
import HTMLView from 'react-native-htmlview';
import { timedisplay } from "@packages/backend/utilities/utility";

const Timeline = ({ navigation }) => {
  const user = useUser();
  const imageUrl = user?.user?.imageUrl;
  const firstName = user?.user?.firstName;
  const { isLoaded, signOut } = useAuth();

  if (!isLoaded) {
    return null;
  }

  const spans = useQuery(api.everwzh.timeline)

  const spansView = spans ? spans.map((span) => (
    <View style={styles.container}>
    <Text style={styles.link}
      onPress={() =>
        navigation.navigate('Episodes', {page: "episodes", podcast_id:span.podcast._id, podcast_name:span.podcast.name})
      }
    >{span.podcast.name}</Text> 
    <HTMLView value={span.episode?.body.title}/>
    <Text>{timedisplay(span.span.start)} to {timedisplay(span.span.end)} {span.span.name}</Text>
    </View>
  )): []


  return (
    <View style={styles.container}>
      <EverwhzHeader navigation={navigation} page={"timeline"}/>
      {spansView}
    </View>
  );
};

export default Timeline;
