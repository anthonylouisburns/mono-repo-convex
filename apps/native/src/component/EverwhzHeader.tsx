import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';

import { useContext, } from 'react';
import { useAuth,  } from '@clerk/clerk-expo';
import { AudioContext } from '../../AudioContext'
import { styles } from './Styles';
import { useStoreUserEffect } from '../useUseStoreEffect';


export const EverwhzHeader = ({ navigation, page }) => {
  const { user } = useStoreUserEffect();
  const imageUrl = user?.imageUrl;
  const firstName = user?.firstName;
  const { signOut } = useAuth();

  const {
    podcast_id,
    podcast_name
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
            navigation.navigate('Episodes', { podcast_id: podcast_id, podcast_name: podcast_name })
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
        <><Text style={styles.selected}>episode</Text></>
      )
    } else {
      return (
        <><Text>episode</Text></>
      )
    }
  }

  return (
    <>
      <View style={styles.yourNotesContainer}>
        {/* @ts-ignore, for css purposes */}
        <Image style={styles.avatarSmall} source={require('../assets/icons/logo.png')} />
        <Text style={styles.rainbowText}>everwhz</Text>
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
      </View>
    </>
  );
};
