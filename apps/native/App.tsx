import React from 'react';
import ErrorBoundary from 'react-native-error-boundary';
import { CustomFallback } from './src/component/CustomFallback';
import AppWithContext from './AppWithContext';

export default function App() {



  return (
    <ErrorBoundary FallbackComponent={CustomFallback}>
      <AppWithContext/>
    </ErrorBoundary>
  );
}
