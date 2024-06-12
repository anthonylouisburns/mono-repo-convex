import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { RFValue } from 'react-native-responsive-fontsize';
import { useOAuth,  } from '@clerk/clerk-expo';


const LoginScreen = () => {
   // Warm up the android browser to improve UX
  // https://docs.expo.dev/guides/authentication/#improving-user-experience
  // useWarmUpBrowser();
  // https://clerk.com/docs/quickstarts/expo - maybe need this
  
  const { startOAuthFlow: startGoogleAuthFlow } = useOAuth({
    strategy: 'oauth_google',
  });

  // not used
  const { startOAuthFlow: startAppleAuthFlow } = useOAuth({
    strategy: 'oauth_apple',
  });

  const onPress = async (authType: string) => {
    try {
      console.log('hello', authType)
      if (authType === 'google') {
        console.log('google oauth started', authType)
        
        const { createdSessionId, signIn, signUp, setActive } = await startGoogleAuthFlow();
        console.log('hello 21', authType)
        if (createdSessionId) {
          setActive({ session: createdSessionId });
        }
      } else if (authType === 'apple') {
        const { createdSessionId, setActive } = await startAppleAuthFlow();
        if (createdSessionId) {
          setActive({ session: createdSessionId });
        }
      }
    } catch (err) {
      console.error('OAuth error', err);
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
          style={styles.buttonGoogle}
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
