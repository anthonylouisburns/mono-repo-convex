import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Timeline from '../screens/Timeline';
import Podcasts from '../screens/Podcasts';
import Episodes from '../screens/Episodes';
import Player from '../screens/Player';

const Stack = createNativeStackNavigator();

const Navigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Timeline" component={Timeline} />
        <Stack.Screen name="Podcasts" component={Podcasts} />
        <Stack.Screen name="Episodes" component={Episodes} />
        <Stack.Screen name="Player" component={Player} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Navigation;
