import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';

import { useContext, } from 'react';
import { AudioContext } from '../../AudioContext'
import { styles } from './Styles';
import { useAuthActions } from '@convex-dev/auth/dist/react';


export const EverwhzHeader = ({ navigation, page }) => {
  // [ ] get user info from backend
  const user  = {"firstName": "Anthony L Burns", "imageUrl": "../assets/icons/logo.png"}
  const imageUrl = undefined;
  const firstName = user?.firstName;
  const { signOut } = useAuthActions();

  const {
    podcast_id,
    podcast_name,
    sound
  } = useContext(AudioContext);

  function logOut() {
    console.log("logging out")

    if (sound) {
      sound.stopAsync()
      sound.unloadAsync()
    }
    signOut()
  }

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
            logOut()
          }
        >

          {imageUrl ? (
            // <Image style={styles.avatarSmall} source={{ uri: imageUrl }} />
            // [ ] use data from backend
            <Image style={styles.avatarSmall} source={require('../assets/icons/logo.png')}  />
          ) : (
            <Text style={styles.exit}>EXIT</Text>
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
