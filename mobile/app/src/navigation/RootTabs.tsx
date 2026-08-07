import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { color } from '@theme';
import { HomeScreen } from '@/screens/home/HomeScreen';
import { SaathiScreen } from '@/screens/saathi/SaathiScreen';
import { PlaybookScreen } from '@/screens/PlaybookScreen';
import { PlaygroundScreen } from '@/screens/PlaygroundScreen';

export type RootTabsParamList = {
  Home: undefined;
  Saathi: undefined;
  Playbook: undefined;
  Playground: undefined;
};

const Tab = createBottomTabNavigator<RootTabsParamList>();

type TabIcon = keyof typeof Ionicons.glyphMap;

const ICONS: Record<keyof RootTabsParamList, TabIcon> = {
  Home: 'home-outline',
  Saathi: 'chatbubbles-outline',
  Playbook: 'book-outline',
  Playground: 'flask-outline',
};

export function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: color.primary50,
        tabBarInactiveTintColor: color.textLow,
        tabBarStyle: {
          backgroundColor: color.surfaceDefault,
          borderTopColor: color.strokeSubtle,
        },
        tabBarIcon: ({ color: tint, size }) => (
          <Ionicons name={ICONS[route.name]} size={size} color={tint} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Saathi" component={SaathiScreen} />
      <Tab.Screen name="Playbook" component={PlaybookScreen} />
      <Tab.Screen name="Playground" component={PlaygroundScreen} />
    </Tab.Navigator>
  );
}
