
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useAuth, useOAuth, } from '@clerk/clerk-expo';
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from 'react';
import React from 'react';
import { AntDesign } from "@expo/vector-icons";


export const useWarmUpBrowser = () => {

  useEffect(() => {
    // Warm up the android browser to improve UX
    // https://docs.expo.dev/guides/authentication/#improving-user-experience
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {

  const { signOut } = useAuth();
  const [disabled_button, set_disabled_button] = useState(false);
  useWarmUpBrowser();

  const { startOAuthFlow: startGoogleAuthFlow } = useOAuth({
    strategy: 'oauth_google',
  });

  // not used yet;
  const { startOAuthFlow: startAppleAuthFlow } = useOAuth({
    strategy: 'oauth_apple',
  })

  function getStartOAuth(authType: string) {
    if (authType === 'google') {
      return startGoogleAuthFlow
    }
    if (authType === 'apple') {
      return startAppleAuthFlow
    }
  }

  const onPress = async (authType: string) => {
    if (disabled_button) {
      console.warn("button currently disabled");
      return;
    }
    set_disabled_button(true);
    setTimeout(() => {
      set_disabled_button(false);
    }, 10000);
    console.log("disabling button");

    const startOAuthFlow = getStartOAuth(authType)
    try {
      console.log('google oauth started', authType)
      const { createdSessionId, setActive } = await startOAuthFlow()
      console.log('finished flow authType:', authType)
      if (createdSessionId) {
        console.log('oauth success creating session', authType)
        setActive!({ session: createdSessionId });
      } else {
        console.log('no session id created', authType)
        set_disabled_button(false)
      }
    } catch (err) {
      console.error('error cleaning up, closing WebBrowser, signing out, enabling button', authType);
      try {
        WebBrowser.dismissAuthSession()
        WebBrowser.dismissBrowser()
      } catch (sencond_err) {
        console.error('WebBrowser error', authType, err);
      }
      signOut()
      set_disabled_button(false)
      if (err) {
        console.error('OAuth error', err);
      } else {
        console.error('error null');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Image
          source={require('../assets/icons/logo.png')} // Ensure the correct path to your logo image file
          style={styles.logo}
        />
        <Text style={styles.title}>Log in to your account</Text>
        <Text style={styles.subtitle}>Welcome! Please login below.</Text>
        <TouchableOpacity
          style={disabled_button ? [styles.buttonGoogle, { opacity: .2 }] : styles.buttonGoogle}
          onPress={() => onPress('google')}
        >
          <Image
            style={styles.googleIcon}
            source={require('../assets/icons/google.png')}
          />
          <Text style={{ ...styles.buttonText, color: '#344054' }}>
            Continue with Google
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={disabled_button ? [styles.buttonApple, { opacity: .2 }] : styles.buttonApple}
          onPress={() => onPress("apple")}
        >
          <AntDesign name="apple1" size={24} color="black" />
          <Text
            style={{ ...styles.buttonText, color: "#344054", marginLeft: 12 }}
          >
            Continue with Apple
          </Text>
        </TouchableOpacity>


        <View style={styles.signupContainer}>
          <Text style={{ fontFamily: 'Regular' }}>Don’t have an account? </Text>
          <Text>Sign up above.</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    padding: 10,
    alignItems: 'center',
    width: '98%',
  },
  logo: {
    width: 74,
    height: 74,
    marginTop: 20,
  },
  title: {
    marginTop: 49,
    fontSize: RFValue(21),
    fontFamily: 'SemiBold',
  },
  subtitle: {
    marginTop: 8,
    fontSize: RFValue(14),
    color: '#000',
    fontFamily: 'Regular',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    fontFamily: 'Regular',
    fontSize: RFValue(14),
  },
  buttonEmail: {
    backgroundColor: '#0D87E1',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    marginBottom: 24,
    minHeight: 44,
  },
  buttonText: {
    textAlign: 'center',
    color: '#FFF',
    fontFamily: 'SemiBold',
    fontSize: RFValue(14),
  },
  buttonTextWithIcon: {
    marginLeft: 10,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#000',
  },
  dividerText: {
    marginHorizontal: 10,
    color: '#000',
    fontFamily: 'Medium',
  },
  buttonGoogle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    width: '100%',
    marginBottom: 12,
    height: 44,
  },
  buttonApple: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    width: '100%',
    marginBottom: 32,
  },
  signupContainer: {
    flexDirection: 'row',
  },
  signupText: {
    color: '#4D9DE0',
    fontFamily: 'SemiBold',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  errorText: {
    fontSize: RFValue(14),
    color: 'tomato',
    fontFamily: 'Medium',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginLeft: 4,
  },
});

export default LoginScreen;
