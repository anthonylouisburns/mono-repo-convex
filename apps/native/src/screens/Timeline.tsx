import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery } from 'convex/react';
import { styles } from '../component/Styles';
import { EverwhzHeader, } from '../component/EverwhzHeader';
import HTMLView from 'react-native-htmlview';
import { timedisplay } from "@packages/backend/utilities/utility";
import { Doc } from '@packages/backend/convex/_generated/dataModel';

const Timeline = ({ navigation }) => {
  const { isLoaded, signOut } = useAuth();

  if (!isLoaded) {
    return null;
  }

  const spans = useQuery(api.everwzh.timeline)

  function episodeView(episode: Doc<"episode">, podcast_name) {
    if (!episode) {
      return (<></>)
    }
    return (
      <>
        <Text style={styles.link} onPress={() => {
          navigation.navigate('Episode', { podcast_name: podcast_name, episode_id: episode._id })
        }}>
          <HTMLView value={episode?.body.title ? episode?.body.title : ""} /></Text>
      </>
    )
  }

  const spansView = spans ? spans.map((span) => (
    <View style={styles.container} key={span.span._id}>
      <Text style={styles.link}
        onPress={() =>
          navigation.navigate('Episodes', { podcast_id: span.podcast._id, podcast_name: span.podcast.name })
        }
      >{span.podcast.name}</Text>
      {episodeView(span.episode, span.podcast.name)}
      <Text>{timedisplay(span.span.start)} to {timedisplay(span.span.end)} {span.span.name}</Text>
    </View>
  )) : []


  return (
    <View style={styles.container}>
      <EverwhzHeader navigation={navigation} page={"timeline"} />
      <ScrollView>
        {spansView}
      </ScrollView>
    </View>
  );
};

export default Timeline;
