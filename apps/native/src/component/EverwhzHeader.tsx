import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';

import { useContext, } from 'react';
import { useAuth, useUser } from '@clerk/clerk-expo';
import Player from './Player';
import { AudioContext } from '../../AudiContext'
import { styles } from './Styles';

export const EverwhzHeader = ({ navigation, page }) => {
  const user = useUser();
  const imageUrl = user?.user?.imageUrl;
  const firstName = user?.user?.firstName;
  const { signOut } = useAuth();

  const {
    episode_id,
    podcast_id
  } = useContext(AudioContext);

  function timeline() {
    if (page == 'timeline') {
      return (
        <><Text style={styles.selected}>timeline</Text> | </>
      )
    } else {
      return (
        <><Text style={styles.link} onPress={() =>
          navigation.navigate('Timeline')
        }>timeline</Text> | </>
      )
    }
  }

  function podcasts() {
    if (page == 'podcast') {
      return (
        <><Text style={styles.selected}>podcasts</Text> | </>
      )
    } else {
      return (
        <><Text style={styles.link} onPress={() =>
          navigation.navigate('Podcasts')
        }>podcasts</Text> | </>
      )
    }
  }

  function episodes() {
    if (page == 'episodes') {
      return (
        <><Text style={styles.selected}>episodes</Text> | </>
      )
    } else {
      if (podcast_id) {
        return (
          <><Text style={styles.link} onPress={() =>
            navigation.navigate('Episodes', { podcast_id: podcast_id })
          }>episodes</Text> | </>
        )
      } else {
        return (
          <><Text>episodes</Text> | </>
        )
      }
    }
  }

  function episode() {
    if (page == 'episode') {
      return (
        <><Text style={styles.selected}>episode</Text> </>
      )
    } else {
      if (episode_id) {
        return (
          <><Text style={styles.link} onPress={() =>
            navigation.navigate('Episode', { episode_id: episode_id })
          }>episode</Text> | </>
        )
      } else {
        return (
          <><Text>episode</Text> | </>
        )
      }
    }
  }

  return (
    <>
      <View style={styles.yourNotesContainer}>
        {/* @ts-ignore, for css purposes */}
        <Image style={styles.avatarSmall} />
        <Text style={styles.title}>Everwhz</Text>
        <TouchableOpacity
          onPress={() =>
            signOut()
          }
        >
          {imageUrl ? (
            <Image style={styles.avatarSmall} source={{ uri: imageUrl }} />
          ) : (
            <Text>{firstName ? firstName : ''}</Text>
          )}
        </TouchableOpacity>
      </View>
      <View style={styles.links}>
        <Text>
          {timeline()}
          {podcasts()}
          {episodes()}
          {episode()}
        </Text>
        {episode_id ? <Player /> : <></>}
      </View>
    </>
  );
};
