import { View, StatusBar, Platform } from 'react-native';
import { useFonts } from 'expo-font';
import { LogBox } from 'react-native';
import Navigation from './src/navigation/Navigation';
import ConvexClientProvider from './ConvexClientProvider';

import { SignedIn, SignedOut } from '@clerk/clerk-expo';
import LoginScreen from './src/screens/LoginScreen';
import { AudioContext } from './AudiContext'
import { Audio, InterruptionModeAndroid, InterruptionModeIOS, } from 'expo-av';
import { useEffect, useState } from 'react';



export default function App() {
  LogBox.ignoreLogs(['Warning: ...']);
  LogBox.ignoreAllLogs();
  const [sound, setSound] = useState<Audio.Sound>();
  const [episode_id, set_episode_id] = useState();
  const [podcast_name, set_podcast_name] = useState();
  const [duration, set_duration] = useState("-");
  const [position, set_position] = useState("-");


  const [loaded] = useFonts({
    Bold: require('./src/assets/fonts/Inter-Bold.ttf'),
    SemiBold: require('./src/assets/fonts/Inter-SemiBold.ttf'),
    Medium: require('./src/assets/fonts/Inter-Medium.ttf'),
    Regular: require('./src/assets/fonts/Inter-Regular.ttf'),

    MBold: require('./src/assets/fonts/Montserrat-Bold.ttf'),
    MSemiBold: require('./src/assets/fonts/Montserrat-SemiBold.ttf'),
    MMedium: require('./src/assets/fonts/Montserrat-Medium.ttf'),
    MRegular: require('./src/assets/fonts/Montserrat-Regular.ttf'),
    MLight: require('./src/assets/fonts/Montserrat-Light.ttf'),
  });
  if (!loaded) {
    return false;
  }

  const STATUS_BAR_HEIGHT =
    Platform.OS === 'ios' ? 50 : StatusBar.currentHeight;


  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: true,
    });
    return sound
      ? () => {
        console.log('Unloading Sound');
        sound.unloadAsync();
      }
      : undefined;
  }, [sound]);

  return (
    <ConvexClientProvider>
      <View style={{ flex: 1 }}>
        <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: '#0D87E1' }}>
          <StatusBar
            translucent
            backgroundColor={'#0D87E1'}
            barStyle="light-content"
          />
        </View>
        <SignedIn>
          <AudioContext.Provider
            value={{
              sound,
              setSound,
              episode_id,
              set_episode_id,
              podcast_name,
              set_podcast_name,
              duration,
              set_duration,
              position,
              set_position
            }}
          >
            <Navigation />
          </AudioContext.Provider>
        </SignedIn>
        <SignedOut>
          <LoginScreen />
        </SignedOut>
      </View>
    </ConvexClientProvider>
  );
}
