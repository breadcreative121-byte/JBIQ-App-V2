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
        <Image source={item.image} style={styles.tileImg} resizeMode="cover" />
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
  // Wrapper View owns the square sizing (Views honour width:'100%' + aspectRatio
  // reliably; a bare Image does not) and clips the image to the rounded tile.
  tile: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: fig.surface,
    // elevation1 (Figma) — soft lift off the festival background
    shadowColor: '#0c0d10',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  tileImg: { width: '100%', height: '100%' },
  label: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: '500',
    color: fig.textHigh,
    ...font('500'),
  },
});
