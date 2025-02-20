import { registerRootComponent } from "expo";

import App from "./App";
// https://rntp.dev/docs/basics/getting-started
// import TrackPlayer from 'react-native-track-player';

// AppRegistry.registerComponent(...);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in the Expo client or in a native build,
// the environment is set up appropriately
registerRootComponent(App);

// TrackPlayer.registerPlaybackService(() => require('./service'));
