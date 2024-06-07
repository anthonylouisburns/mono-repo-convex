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

export const EverwhzHeader = ({ navigation, page }) => {
  const user = useUser();
  const imageUrl = user?.user?.imageUrl;
  const firstName = user?.user?.firstName;
  const { signOut } = useAuth();


  function podcast() {
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

  function episode() {
    if (page == 'episodes') {
      return (
        <><Text style={styles.selected}>episodes</Text> </>
      )
    } else {
      return (
        <><Text>episodes</Text> </>
      )
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
          {podcast()}
          {episode()}
        </Text>
      </View>
    </>
  );
};

export const styles = StyleSheet.create({
  links: {
    alignItems: 'center'
  },
  selected: {
    color: 'green'
  },
  link: {
    color: 'blue'
  },
  container: {
    margin: 5
  },
  header: {
    backgroundColor: '#0D87E1',
    height: 67,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  title: {
    fontSize: RFValue(17.5),
    fontFamily: 'MMedium',
    alignSelf: 'center',
  },
  yourNotesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    marginTop: 19,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 15,
    marginTop: 30,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: RFValue(15),
    fontFamily: 'MRegular',
    color: '#2D2D2D',
  },
  notesList: {
    flex: 1,
  },
  noteItem: {
    padding: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.59)',

    backgroundColor: '#F9FAFB',
  },
  noteText: {
    fontSize: 16,
    fontFamily: 'MLight',
    color: '#2D2D2D',
  },

  newNoteButton: {
    flexDirection: 'row',
    backgroundColor: '#0D87E1',
    borderRadius: 7,
    width: Dimensions.get('window').width / 1.6,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    position: 'absolute',
    bottom: 35,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,

    elevation: 6,
  },
  newNoteButtonText: {
    color: 'white',
    fontSize: RFValue(15),
    fontFamily: 'MMedium',
    marginLeft: 10,
  },
  switchContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  emptyStateText: {
    textAlign: 'center',
    alignSelf: 'center',
    fontSize: RFValue(15),
    color: 'grey',
    fontFamily: 'MLight',
  },
  emptyState: {
    width: '100%',
    height: '35%',
    marginTop: 19,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.59)',
  },
});