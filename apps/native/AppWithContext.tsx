import { View, Text, StatusBar, Platform } from "react-native";
import { useFonts } from "expo-font";
import { LogBox } from "react-native";
import Navigation from "./src/navigation/Navigation";

import { useEffect, useState } from "react";
import React from "react";
import * as WebBrowser from "expo-web-browser";
import { AuthLoading } from "convex/react";
import * as SecureStore from "expo-secure-store";
import uuid from "react-uuid";
const deviceIdKey = "everwhz-deviceId";
import * as Application from "expo-application";
import { PlayerContext } from "./PlayerContext";
import { Id } from "@packages/backend/convex/_generated/dataModel";
export const getDeviceId = async () => {
  let deviceId = await SecureStore.getItemAsync(deviceIdKey);

  if (!deviceId) {
    deviceId = uuid();
    await SecureStore.setItemAsync(deviceIdKey, deviceId);
  }

  return deviceId;
};

export default function AppWithContext() {
  LogBox.ignoreLogs(["Warning: ..."]);
  LogBox.ignoreAllLogs();

  const [deviceId, setDeviceId] = useState<string>("-");
  const [episodePlayingId, setEpisodePlayingId] = useState<Id<"episode"> | null>(null);
  const [podcastPlayingId, setPodcastPlayingId] = useState<Id<"podcast"> | null>(null);

  const [loaded] = useFonts({
    Bold: require("./src/assets/fonts/Inter-Bold.ttf"),
    SemiBold: require("./src/assets/fonts/Inter-SemiBold.ttf"),
    Medium: require("./src/assets/fonts/Inter-Medium.ttf"),
    Regular: require("./src/assets/fonts/Inter-Regular.ttf"),

    MBold: require("./src/assets/fonts/Montserrat-Bold.ttf"),
    MSemiBold: require("./src/assets/fonts/Montserrat-SemiBold.ttf"),
    MMedium: require("./src/assets/fonts/Montserrat-Medium.ttf"),
    MRegular: require("./src/assets/fonts/Montserrat-Regular.ttf"),
    MLight: require("./src/assets/fonts/Montserrat-Light.ttf"),
  });

  const STATUS_BAR_HEIGHT =
    Platform.OS === "ios" ? 50 : StatusBar.currentHeight;

  WebBrowser.maybeCompleteAuthSession();


  useEffect(() => {
    async function getDeviceId() {
      try {
        if (Platform.OS === 'android') {
          const id = Application.getAndroidId();
          setDeviceId(id);
        } else if (Platform.OS === 'ios') {
          const id = await Application.getIosIdForVendorAsync();
          setDeviceId(id);
        }
      } catch (error) {
        console.error('Failed to get device ID:', error);
      }
    }

    getDeviceId();
  }, []);


  if (!loaded) {
    return false;
  }

  return (
    <>
      <View style={{ flex: 1 }}>
        <View style={{ height: STATUS_BAR_HEIGHT, backgroundColor: "#0D87E1" }}>
          <StatusBar
            translucent
            backgroundColor={"#0D87E1"}
            barStyle="light-content"
          />
        </View>
        <AuthLoading>
          <Text>loading...</Text>
        </AuthLoading>
        <PlayerContext.Provider
          value={{
            deviceId,
            episodePlayingId,
            setEpisodePlayingId,
            podcastPlayingId,
            setPodcastPlayingId,
          }}
        >
          <Navigation />
        </PlayerContext.Provider>
      </View>
    </>
  );
}
