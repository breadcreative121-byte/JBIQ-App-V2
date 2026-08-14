/* Peach icon circle with an orange glyph — the uniform icon treatment used
   across Home phrase rows and every Space card in the Figma. Renders a real JDS
   glyph when `jds` is given, otherwise the closest semantic vector icon. */
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { JdsIcon } from './JdsIcon';
import type { JdsName } from '@/theme/jdsIcons';

export type GlyphName = keyof typeof MaterialCommunityIcons.glyphMap;

export function AccentIconChip({
  icon,
  jds,
  size = 40,
  iconSize,
  bare,
}: {
  icon?: GlyphName;
  jds?: JdsName;
  size?: number;
  iconSize?: number;
  bare?: boolean;
}) {
  const glyph = iconSize ?? Math.round(size * 0.5);
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        bare && styles.bare,
      ]}
    >
      {jds ? (
        <JdsIcon name={jds} size={glyph} color={fig.accent} />
      ) : icon ? (
        <MaterialCommunityIcons name={icon} size={glyph} color={fig.accent} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: fig.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bare: { backgroundColor: 'transparent' },
});
