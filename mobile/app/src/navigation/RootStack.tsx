/* Root navigation — a native stack, following the Figma shell (no bottom tab
   bar). Home is the root and holds one connected pager: Menu · Home · the six
   Spaces (swipe or the header icons move between them). Saathi (existing voice
   screen) is pushed from the composer mic / any sayable phrase; the Menu's rows
   reach the existing Playbook / Playground / Saathi surfaces. */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { SaathiScreen } from '@/screens/saathi/SaathiScreen';
import { PlaybookScreen } from '@/screens/PlaybookScreen';
import { PlaygroundScreen } from '@/screens/PlaygroundScreen';

export type RootStackParamList = {
  Home: undefined;
  Saathi: { prompt?: string; mode?: 'text' | 'voice' } | undefined;
  Playbook: undefined;
  Playground: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Saathi" component={SaathiScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name="Playbook" component={PlaybookScreen} />
      <Stack.Screen name="Playground" component={PlaygroundScreen} />
    </Stack.Navigator>
  );
}
