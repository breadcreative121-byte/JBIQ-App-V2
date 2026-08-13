/* Big stacked prompt card (Figma 200:7406 / 200:6959) — the "Cards" variant of
   the prompt cards: a full-width #f5f5f6 card with a centred 3D image on top and
   the quoted sentence centred below. Falls back to the accent glyph when a prompt
   has no bundled image. Tapping hands the text to Saathi (springy push on tap),
   same as PromptTileRow / PhraseRow. */
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

export function BigPromptCard({
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
      style={[styles.card, dim && styles.dim, { transform: [{ scale }] }]}
    >
      {image ? (
        <Image source={image} style={styles.image} resizeMode="contain" />
      ) : (
        <View style={styles.image}>
          {jds ? (
            <JdsIcon name={jds} size={40} color={fig.accent} />
          ) : icon ? (
            <MaterialCommunityIcons name={icon} size={40} color={fig.accent} />
          ) : null}
        </View>
      )}
      <Text style={styles.text} numberOfLines={1}>
        “{text}”
      </Text>
      {locked ? (
        <Ionicons name="lock-closed-outline" size={16} color={fig.textLow} style={styles.trail} />
      ) : soon ? (
        <Ionicons name="notifications-outline" size={16} color={fig.textLow} style={styles.trail} />
      ) : null}
    </AnimatedPressable>
  );
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: fig.tileSurface,
  },
  dim: { opacity: 0.72 },
  // The tile art has white rounded-corner gaps; clip to a rounded rect so only
  // the #f5f5f6 body (which matches the card) shows — the emoji floats cleanly.
  image: {
    width: 60,
    height: 60,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: '500',
    color: fig.textHigh,
    textAlign: 'center',
    ...font('500'),
  },
  trail: { position: 'absolute', top: 10, right: 12 },
});
