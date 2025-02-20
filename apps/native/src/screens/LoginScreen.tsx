import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Button,
} from "react-native";
import { RFValue } from "react-native-responsive-fontsize";
import React from "react";
import { AntDesign } from "@expo/vector-icons";
import { useAuthActions } from "@convex-dev/auth/react";
import { makeRedirectUri } from "expo-auth-session";
import { openAuthSessionAsync } from "expo-web-browser";
import { useConvexAuth } from "convex/react";
import OsLogger from "react-native-os-logger";
import { EverwhzHeader } from "../component/EverwhzHeader";

const redirectTo = makeRedirectUri();

const LoginScreen = ({ navigation }) => {
  const { signIn } = useAuthActions();
  const disabled_button = false;
  const { isLoading, isAuthenticated } = useConvexAuth();

  //[ ] https://labs.convex.dev/auth/config/oauth#callback-url
  //[ ] https://labs.convex.dev/auth/config/oauth#environment-variables

  const handleSignIn = async (authType: string) => {
    const { redirect } = await signIn(authType, { redirectTo });
    console.log("everwhz.LoginScreen 1", redirect, isLoading, isAuthenticated);
    const result = await openAuthSessionAsync(redirect!.toString(), redirectTo);
    console.log("everwhz.LoginScreen 2", result);
    if (result.type === "success") {
      const { url } = result;
      const code = new URL(url).searchParams.get("code")!;
      console.log("everwhz.LoginScreen 3", code, url);
      await signIn(authType, { code });
      console.log("everwhz.LoginScreen 4 isAuthenticated");
      navigation.navigate("Timeline");
    } else {
      console.error("error", result);
    }
  };

  return (
    <View style={styles.container}>
      <EverwhzHeader navigation={navigation} page="login" />
      <View style={styles.card}>
        <Image
          source={require("../assets/icons/logo.png")} // Ensure the correct path to your logo image file
          style={styles.logo}
        />
        <Text style={styles.title}>Log in to your account</Text>
        <Text style={styles.subtitle}>Welcome! Please login below.</Text>

        <TouchableOpacity
          style={
            disabled_button
              ? [styles.buttonGoogle, { opacity: 0.2 }]
              : styles.buttonGoogle
          }
          onPress={() => handleSignIn("github")}
        >
          {/* <Image
            style={styles.googleIcon}
            source={require('../assets/icons/google.png')}
          /> */}
          <Text style={{ ...styles.buttonText, color: "#344054" }}>
            Continue with GitHub
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            disabled_button
              ? [styles.buttonGoogle, { opacity: 0.2 }]
              : styles.buttonGoogle
          }
          onPress={() => handleSignIn("google")}
        >
          <Image
            style={styles.googleIcon}
            source={require("../assets/icons/google.png")}
          />
          <Text style={{ ...styles.buttonText, color: "#344054" }}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={
            disabled_button
              ? [styles.buttonApple, { opacity: 0.2 }]
              : styles.buttonApple
          }
          onPress={() => handleSignIn("apple")}
        >
          <AntDesign name="apple1" size={24} color="black" />
          <Text
            style={{ ...styles.buttonText, color: "#344054", marginLeft: 12 }}
          >
            Continue with Apple
          </Text>
        </TouchableOpacity>

        <View style={styles.signupContainer}>
          <Text style={{ fontFamily: "Regular" }}>Don’t have an account? </Text>
          <Text>Sign up above.</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "#fff",
    padding: 10,
    alignItems: "center",
    width: "98%",
  },
  logo: {
    width: 74,
    height: 74,
    marginTop: 20,
  },
  title: {
    marginTop: 49,
    fontSize: RFValue(21),
    fontFamily: "SemiBold",
  },
  subtitle: {
    marginTop: 8,
    fontSize: RFValue(14),
    color: "#000",
    fontFamily: "Regular",
    marginBottom: 32,
    textAlign: "center",
  },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D0D5DD",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontFamily: "Regular",
    fontSize: RFValue(14),
  },
  buttonEmail: {
    backgroundColor: "#0D87E1",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    marginBottom: 24,
    minHeight: 44,
  },
  buttonText: {
    textAlign: "center",
    color: "#FFF",
    fontFamily: "SemiBold",
    fontSize: RFValue(14),
  },
  buttonTextWithIcon: {
    marginLeft: 10,
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#000",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#000",
    fontFamily: "Medium",
  },
  buttonGoogle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    width: "100%",
    marginBottom: 12,
    height: 44,
  },
  buttonApple: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D0D5DD",
    width: "100%",
    marginBottom: 32,
  },
  signupContainer: {
    flexDirection: "row",
  },
  signupText: {
    color: "#4D9DE0",
    fontFamily: "SemiBold",
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  errorText: {
    fontSize: RFValue(14),
    color: "tomato",
    fontFamily: "Medium",
    alignSelf: "flex-start",
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default LoginScreen;
