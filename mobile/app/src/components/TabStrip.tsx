/* Horizontal tab strip (ChipGroup) from Figma Spaces. Active tab = peach pill. */
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
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
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.label, { color: on ? fig.textHigh : fig.textLow }]}>{label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'transparent',
  },
  chipOn: { backgroundColor: fig.accentSurface },
  label: { fontSize: 14, fontWeight: '500', ...font('500') },
});
