import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStack } from '@/navigation/RootStack';
// import { useFonts } from 'expo-font';

export default function App() {
  // JioType — enable once the .ttf files are in assets/fonts/ (see
  // assets/fonts/README.md and src/theme/fonts.ts → FONT_ENABLED = true):
  //
  // const [fontsLoaded] = useFonts({
  //   'JioType-Regular': require('./assets/fonts/JioType-Regular.ttf'),
  //   'JioType-Medium': require('./assets/fonts/JioType-Medium.ttf'),
  //   'JioType-Bold': require('./assets/fonts/JioType-Bold.ttf'),
  //   'JioType-ExtraBold': require('./assets/fonts/JioType-ExtraBold.ttf'),
  //   'JioType-Black': require('./assets/fonts/JioType-Black.ttf'),
  // });
  // if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <RootStack />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
