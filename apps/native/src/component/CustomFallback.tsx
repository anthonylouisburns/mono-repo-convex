import React from 'react';
import {
    View,
    Text,
    Button,
} from 'react-native';

// https://react-native-error-boundary.js.org/usage/rendering-a-custom-fallback-ui
export const CustomFallback = (props: { error: Error, resetError: Function }) => (
    <View>
      <Text>Something happened!</Text>
      <Text>{props.error.toString()}</Text>
      {/* <Button onPress={props.resetError} title={'Try again'} /> */}
    </View>
  )

  