import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

import { useContext } from "react";
import { AudioContext } from "../../AudioContext";
import { styles } from "./Styles";
import { useAuthActions } from "@convex-dev/auth/dist/react";
import { Authenticated, Unauthenticated, useConvexAuth } from "convex/react";
import { auth } from "@packages/backend/convex/auth";
import { PlayerContext } from "../../PlayerContext";

export const EverwhzHeader = ({ navigation, page }) => {
  // [ ] get user info from backend
  const { signOut } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();

  const { podcastPlayingId } = useContext(PlayerContext);

  function logOut() {
    console.log("logging out");
    signOut();
  }

  function timeline() {
    if (page == "timeline") {
      return (
        <>
          <Text style={styles.selected}>timeline</Text> |{" "}
        </>
      );
    } else {
      return (
        <>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("TimelinePage")}
          >
            timeline
          </Text>{" "}
          |{" "}
        </>
      );
    }
  }

  function podcasts() {
    if (page == "podcast") {
      return (
        <>
          <Text style={styles.selected}>podcasts</Text> |{" "}
        </>
      );
    } else {
      return (
        <>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate("Podcasts")}
          >
            podcasts
          </Text>{" "}
          |{" "}
        </>
      );
    }
  }

  function episodes() {
    if (page == "episodes") {
      return (
        <>
          <Text style={styles.selected}>episodes</Text> |{" "}
        </>
      );
    } else {
      if (podcastPlayingId) {
        return (
          <>
            <Text
              style={styles.link}
              onPress={() =>
                navigation.navigate("Episodes", {
                  podcast_id: podcastPlayingId,
                })
              }
            >
              episodes
            </Text>{" "}
            |{" "}
          </>
        );
      } else {
        return (
          <>
            <Text>episodes</Text> |{" "}
          </>
        );
      }
    }
  }

  function episode() {
    if (page == "episode") {
      return (
        <>
          <Text style={styles.selected}>episode</Text>
        </>
      );
    } else {
      return (
        <>
          <Text>episode</Text>
        </>
      );
    }
  }

  function log_in_out() {
    if (page == "login") {
      return <></>;
    } else {
      return (
        <>
          <Authenticated>
            <Text style={styles.exit}>EXIT</Text>
          </Authenticated>
          <Unauthenticated>
            <Text style={styles.enter}>LOGIN</Text>
          </Unauthenticated>
        </>
      );
    }
  }
  return (
    <>
      <View style={styles.yourNotesContainer}>
        {/* @ts-ignore, for css purposes */}
        <Image
          style={styles.avatarSmall}
          source={require("../assets/icons/logo.png")}
        />
        <Text style={styles.rainbowText}>evrwhz</Text>
        <TouchableOpacity
          onPress={() => {
            if (isAuthenticated) {
              logOut();
            }
            navigation.navigate("LoginScreen");
          }}
        >
          {log_in_out()}
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
