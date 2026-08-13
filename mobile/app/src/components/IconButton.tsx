/* 40×40 ghost circular icon button — the header control from Figma. Renders a
   JDS glyph when `jds` is given, otherwise an Ionicon. */
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { JdsIcon } from './JdsIcon';
import type { JdsName } from '@/theme/jdsIcons';

type IoniconName = keyof typeof Ionicons.glyphMap;

export function IconButton({
  icon,
  jds,
  onPress,
  size = 22,
  accessibilityLabel,
  variant = 'ghost',
}: {
  icon?: IoniconName;
  jds?: JdsName;
  onPress?: () => void;
  size?: number;
  accessibilityLabel?: string;
  variant?: 'ghost' | 'onBold'; // onBold = filled indigo circle + white glyph (festive header)
}) {
  const onBold = variant === 'onBold';
  const glyphColor = onBold ? fig.textOnBrand : fig.textHigh;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      style={({ pressed }) => [
        styles.btn,
        onBold && styles.onBold,
        pressed && (onBold ? styles.pressedBold : styles.pressed),
      ]}
    >
      {jds ? (
        <JdsIcon name={jds} size={size} color={glyphColor} />
      ) : icon ? (
        <Ionicons name={icon} size={size} color={glyphColor} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: fig.surfaceGhost, // "contained" icon-button surface (Figma)
  },
  pressed: { backgroundColor: '#e3e3e4' },
  // Festive header sits on the indigo bg (== brand), so a solid brand circle would
  // vanish — use a subtle dark scrim so the circle reads while glyphs stay white.
  onBold: { backgroundColor: 'rgba(0,0,0,0.16)' },
  pressedBold: { backgroundColor: 'rgba(0,0,0,0.28)' },
});
