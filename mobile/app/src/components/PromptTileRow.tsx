/* Image-tile prompt card (Figma 179:7263) — the alternate treatment for Home
   phrase rows and Space list rows: a 65×65 rounded tile holding a 3D image on
   the left, the quoted sentence on the right. Falls back to the classic accent
   glyph in a grey tile when a prompt has no bundled image. Tapping hands the
   text to Saathi, same as PhraseRow / ActionCard. */
import { useRef } from 'react';
import {
  Pressable,
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  type ImageSourcePropType,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { JdsIcon } from './JdsIcon';
import type { GlyphName } from './AccentIconChip';
import type { JdsName } from '@/theme/jdsIcons';

export function PromptTileRow({
  image,
  icon,
  jds,
  text,
  soon,
  locked,
  onPress,
  onNotify,
}: {
  image?: ImageSourcePropType;
  icon?: GlyphName;
  jds?: JdsName;
  text: string;
  soon?: boolean;
  locked?: boolean; // causally gated — dimmed, states the reason
  onPress?: () => void;
  onNotify?: () => void;
}) {
  const dim = soon || locked;
  const scale = useRef(new Animated.Value(1)).current;
  const spring = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 8 }).start();
  return (
    <AnimatedPressable
      onPress={soon ? onNotify : onPress}
      onPressIn={() => spring(0.97)}
      onPressOut={() => spring(1)}
      accessibilityRole="button"
      accessibilityLabel={text}
      accessibilityState={{ disabled: locked }}
      style={[styles.row, dim && styles.dim, { transform: [{ scale }] }]}
    >
      {image ? (
        <Image source={image} style={styles.tile} resizeMode="contain" />
      ) : (
        <View style={[styles.tile, styles.tileFallback]}>
          {jds ? (
            <JdsIcon name={jds} size={30} color={fig.accent} />
          ) : icon ? (
            <MaterialCommunityIcons name={icon} size={30} color={fig.accent} />
          ) : null}
        </View>
      )}
      <Text style={styles.text} numberOfLines={1}>
        “{text}”
      </Text>
      {locked ? (
        <Ionicons name="lock-closed-outline" size={18} color={fig.textLow} style={styles.trail} />
      ) : soon ? (
        <Ionicons name="notifications-outline" size={18} color={fig.textLow} style={styles.trail} />
      ) : null}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    borderRadius: 12,
  },
  dim: { opacity: 0.72 },
  tile: {
    width: 65,
    height: 65,
    borderRadius: 16,
    backgroundColor: fig.tileSurface,
  },
  tileFallback: { alignItems: 'center', justifyContent: 'center' },
  text: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: fig.textHigh,
    ...font('500'),
  },
  trail: { marginLeft: 4 },
});
