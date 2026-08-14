import { useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { color, space } from '@theme';
import { text as type } from '@/theme/typography';
import { API_BASE_URL } from '@/config';
import { WebTab } from './WebTab';

export type WebItem = { id: string; title: string; subtitle?: string; path: string };

type StackParams = {
  List: undefined;
  Web: { url: string; title: string };
};

const Stack = createNativeStackNavigator<StackParams>();

function Row({ item, onPress }: { item: WebItem; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: color.surfaceMinimal }]}
    >
      <View style={styles.rowText}>
        <Text style={[type.titleS, { color: color.textHigh }]}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={[type.bodyS, { color: color.textLow }]}>{item.subtitle}</Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={color.textLow} />
    </Pressable>
  );
}

function makeListScreen(items: WebItem[]) {
  return function ListScreen({ navigation }: NativeStackScreenProps<StackParams, 'List'>) {
    return (
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Row
            item={item}
            onPress={() =>
              navigation.navigate('Web', {
                url: `${API_BASE_URL}/${item.path}`,
                title: item.title,
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        style={styles.list}
      />
    );
  };
}

function WebScreen({ route }: NativeStackScreenProps<StackParams, 'Web'>) {
  return <WebTab url={route.params.url} />;
}

export function WebStack({ title, items }: { title: string; items: WebItem[] }) {
  const ListScreen = useMemo(() => makeListScreen(items), [items]);
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: color.primary50,
        headerStyle: { backgroundColor: color.surfaceDefault },
        headerTitleStyle: { color: color.textHigh },
        contentStyle: { backgroundColor: color.surfaceDefault },
      }}
    >
      <Stack.Screen name="List" component={ListScreen} options={{ title }} />
      <Stack.Screen
        name="Web"
        component={WebScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: color.surfaceDefault },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space.l,
    paddingVertical: space.m,
    gap: space.m,
  },
  rowText: { flex: 1, gap: space['4xs'] },
  sep: { height: 1, backgroundColor: color.strokeSubtle, marginLeft: space.l },
});
