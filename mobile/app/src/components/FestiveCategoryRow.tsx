/* The 3-across category row on the Festive Home (Figma 193:4239) — square image
   cards (Lights / Feasts / Puja) with a label beneath each. Tapping hands the
   category's `prompt` to Saathi. Renders full-width; the caller sets the inset.
   Tapping a card gives a springy "push" (scale down + release) instead of a
   flat opacity change. */
import { useRef } from 'react';
import { View, Text, Image, Pressable, Animated, StyleSheet } from 'react-native';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import type { FestiveCategory } from '@/screens/home/festive';

export function FestiveCategoryRow({
  items,
  onPress,
}: {
  items: FestiveCategory[];
  onPress: (prompt: string) => void;
}) {
  return (
    <View style={styles.row}>
      {items.map((it) => (
        <CategoryCard key={it.label} item={it} onPress={() => onPress(it.prompt)} />
      ))}
    </View>
  );
}

function CategoryCard({ item, onPress }: { item: FestiveCategory; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
  return (
    <Pressable
      style={styles.col}
      onPress={onPress}
      onPressIn={() => spring(0.93)}
      onPressOut={() => spring(1)}
      accessibilityRole="button"
      accessibilityLabel={item.label}
    >
      <Animated.View style={[styles.tile, { transform: [{ scale }] }]}>
        <Image source={item.image} style={styles.tileImg} resizeMode="contain" />
      </Animated.View>
      <Text style={styles.label} numberOfLines={1}>
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 11 },
  col: { flex: 1, alignItems: 'center' },
  // Grey card with the 3D image inset + centred (Figma 192:11722 — 76px image in
  // a ~99px card, ~12px padding). The image's baked #f5f5f6 backdrop matches the
  // card so it blends; padding keeps every category the same size.
  tile: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: fig.tileSurface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  tileImg: { width: '100%', height: '100%', borderRadius: 26 },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: fig.textHigh,
    ...font('500'),
  },
});
