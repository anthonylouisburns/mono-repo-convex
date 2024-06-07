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

  if (!isLoaded) {
    return null;
  }




  return (
    <View style={styles.container}>


      <EverwhzHeader navigation={navigation} page="podcast"/>
      <Text>hi tony podcasts</Text>



    </View>
  );
};

export default Timeline;
