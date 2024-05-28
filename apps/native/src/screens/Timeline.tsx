import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Feather, AntDesign } from '@expo/vector-icons';
import { RFValue } from 'react-native-responsive-fontsize';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { api } from '@packages/backend/convex/_generated/api';
import { useQuery } from 'convex/react';

const Timeline = ({ navigation }) => {
  const user = useUser();
  const imageUrl = user?.user?.imageUrl;
  const firstName = user?.user?.firstName;

  const timeline = useQuery(api.everwzh.timeline);
  const [search, setSearch] = useState('');

 

  return (
    <Text>HELLO</Text>
  );
};

export default Timeline;