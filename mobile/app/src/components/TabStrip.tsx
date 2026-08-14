/* Horizontal tab strip (JDS Tab.Group) from Figma 169:4507. Underline style:
   the active tab is darker text with a 2px indigo indicator; inactive tabs use
   the low-emphasis content colour. */
import { ScrollView, Pressable, Text, View, StyleSheet } from 'react-native';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';

export function TabStrip({
  tabs,
  active,
  onSelect,
}: {
  tabs: string[];
  active: number;
  onSelect: (index: number) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {tabs.map((label, i) => {
        const on = i === active;
        return (
          <Pressable
            key={label}
            onPress={() => onSelect(i)}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            style={styles.tab}
          >
            <View style={styles.inner}>
              <Text style={[styles.label, { color: on ? fig.textHigh : fig.textLow }]}>
                {label}
              </Text>
              {on ? <View style={styles.indicator} /> : null}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, alignItems: 'center' },
  tab: { height: 40, justifyContent: 'center', paddingHorizontal: 10 },
  inner: { height: '100%', justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500', lineHeight: 14, ...font('500') },
  indicator: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    height: 2,
    borderRadius: 2,
    backgroundColor: fig.brand,
  },
});
