/* First-run education for the Spaces area. A bottom sheet that springs up the
   first time (per session) a user lands on a Space, explaining what Spaces is.
   Built on core Animated + PanResponder (no gesture-handler / no new deps).
   Dismiss via "Got it", the backdrop, or a swipe-down. */
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

// react-native-web doesn't reliably apply native-driven transforms, so the
// translateY entrance can stay stuck off-screen. Drive it on the JS thread on web.
const NATIVE_DRIVER = Platform.OS !== 'web';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { AppButton } from './AppButton';
import type { GlyphName } from './AccentIconChip';
import { VERTICALS } from '@/screens/spaces/verticals';

// A representative glyph per Space, shown to the left of each tag.
const CHIP_ICON: Record<string, GlyphName> = {
  astrology: 'star-four-points',
  devotion: 'hands-pray',
  health: 'heart-pulse',
  career: 'briefcase-outline',
  friend: 'account-heart-outline',
  news: 'newspaper-variant-outline',
};

export function SpacesIntroSheet({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  // Native slides up from below; web starts at rest (the RNW translateY spring
  // can stay stuck off-screen, so don't gate visibility on it) — backdrop fades.
  const y = useRef(new Animated.Value(NATIVE_DRIVER ? screenH : 0)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(y, { toValue: 0, useNativeDriver: NATIVE_DRIVER, damping: 20, stiffness: 180, mass: 0.9 }),
      Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: NATIVE_DRIVER }),
    ]).start();
  }, [y, backdrop]);

  const close = () => {
    Animated.parallel([
      Animated.timing(y, {
        toValue: screenH,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: NATIVE_DRIVER,
      }),
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: NATIVE_DRIVER }),
    ]).start(() => onClose());
  };

  // Swipe the sheet down to dismiss (claims vertical-down drags only, so taps
  // on the button still register).
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => {
        if (g.dy > 0) y.setValue(g.dy);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 120) close();
        else Animated.spring(y, { toValue: 0, useNativeDriver: NATIVE_DRIVER, damping: 20, stiffness: 200 }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss" />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: y }] }]}
        {...pan.panHandlers}
      >
        <View style={styles.handle} />

        <Text style={styles.title}>Welcome to Spaces</Text>
        <Text style={styles.body}>
          Your corners for the things that matter — each Space is ready with widgets and actions the
          moment you arrive. Just tap, or say what you need.
        </Text>

        <View style={styles.chips}>
          {VERTICALS.map((v) => (
            <View key={v.id} style={styles.chip}>
              <MaterialCommunityIcons
                name={CHIP_ICON[v.id] ?? 'shape-outline'}
                size={15}
                color={fig.accent}
              />
              <Text style={styles.chipLabel}>{v.tab}</Text>
            </View>
          ))}
        </View>

        <View style={styles.hint}>
          <Ionicons name="chevron-back" size={14} color={fig.textLow} />
          <Text style={styles.hintText}>Swipe to move between Spaces</Text>
          <Ionicons name="chevron-forward" size={14} color={fig.textLow} />
        </View>

        <AppButton label="Got it" variant="solid" onPress={close} style={styles.cta} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 30 },
  backdrop: { backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: fig.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(12,13,16,0.15)',
    marginBottom: 18,
  },
  title: { fontSize: 20, fontWeight: '800', color: fig.textHigh, ...font('800'), marginBottom: 8 },
  body: { fontSize: 15, lineHeight: 21, color: fig.textLow, ...font('400'), marginBottom: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: fig.accentSurface,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipLabel: { fontSize: 13, fontWeight: '700', color: fig.textHigh, ...font('700') },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  hintText: { fontSize: 13, color: fig.textLow, ...font('500') },
  cta: { alignSelf: 'stretch' },
});
