import { useCallback, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStack } from '@/navigation/RootStack';
import { SplashGate } from '@/components/SplashGate';

// Hold the native splash until the animated brand splash is on screen.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  // Once the Lottie splash has laid out, hide the native splash beneath it.
  const onSplashReady = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootStack />
      </NavigationContainer>
      {splashDone ? null : (
        <SplashGate onReady={onSplashReady} onDone={() => setSplashDone(true)} />
      )}
    </SafeAreaProvider>
  );
}
