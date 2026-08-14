/* First-run "warm ask" before the OS microphone dialog. A bottom sheet that
   explains why Saathi needs the mic, then requests the permission on "Okay,
   listen" and hands back to the caller (which opens the voice screen). Built on
   core Animated + PanResponder — same mechanics as SpacesIntroSheet, no new deps.
   Dismiss via "Not now", the backdrop, or a swipe-down. */
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requestRecordingPermissionsAsync } from 'expo-audio';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';
import { AvatarView } from '@/screens/saathi/AvatarView';
import { Button } from './Button';
import { AccentIconChip, type GlyphName } from './AccentIconChip';

// The Saathi voice orb, reused as the sheet's mark (works on native + web via
// AvatarView's platform variants).
const ORB = require('../../assets/lottie/mic-orb.json');

// Why voice beats tapping — the reason to say yes — shown as a small strip so
// the value is seen, not just read. Icons use the app's peach AccentIconChip.
const BENEFITS: { icon: GlyphName; label: string }[] = [
  { icon: 'lightning-bolt', label: 'Faster than typing — just say it' },
  { icon: 'keyboard-off-outline', label: 'No menus, no forms — just ask' },
  { icon: 'translate', label: 'Speak naturally, in your own language' },
];

export function MicPermissionSheet({
  onAllow,
  onDismiss,
}: {
  onAllow: () => void;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: screenH } = useWindowDimensions();

  const y = useRef(new Animated.Value(screenH)).current; // start below screen
  const backdrop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 180, mass: 0.9 }),
      Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [y, backdrop]);

  // Animate the sheet away, then run `after` (either onAllow or onDismiss).
  const dismissWith = (after: () => void) => {
    Animated.parallel([
      Animated.timing(y, {
        toValue: screenH,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => after());
  };

  const handleAllow = async () => {
    // Warm ask first, then the real OS prompt. Grant or deny, we proceed to the
    // voice screen — a denial is surfaced there by the existing mic-error toast.
    try {
      await requestRecordingPermissionsAsync();
    } catch {
      // ignore — proceed regardless
    }
    dismissWith(onAllow);
  };

  const handleDismiss = () => dismissWith(onDismiss);

  // Swipe the sheet down to dismiss (claims vertical-down drags only, so taps
  // on the buttons still register).
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_e, g) => {
        if (g.dy > 0) y.setValue(g.dy);
      },
      onPanResponderRelease: (_e, g) => {
        if (g.dy > 120) handleDismiss();
        else Animated.spring(y, { toValue: 0, useNativeDriver: true, damping: 20, stiffness: 200 }).start();
      },
    }),
  ).current;

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdrop }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss} accessibilityLabel="Dismiss" />
      </Animated.View>

      <Animated.View
        style={[styles.sheet, { paddingBottom: insets.bottom + 16, transform: [{ translateY: y }] }]}
        {...pan.panHandlers}
      >
        <View style={styles.handle} />

        <View style={styles.orb}>
          <AvatarView source={ORB} size={72} />
        </View>

        <Text style={styles.title}>Just say it — Saathi does the rest</Text>

        <View style={styles.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.label} style={styles.benefitRow} accessibilityLabel={b.label}>
              <AccentIconChip icon={b.icon} size={28} />
              <Text style={styles.benefitLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        <Button label="Okay, let's talk" variant="primary" onPress={handleAllow} style={styles.cta} />
        <Pressable onPress={handleDismiss} accessibilityRole="button" style={styles.secondary}>
          <Text style={styles.secondaryText}>Maybe later</Text>
        </Pressable>
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
    alignItems: 'center',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(12,13,16,0.15)',
    marginBottom: 18,
  },
  orb: { marginBottom: 12, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '800', color: fig.textHigh, ...font('800'), marginBottom: 16, textAlign: 'center' },
  benefits: { alignSelf: 'stretch', gap: 10, marginBottom: 24 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  benefitLabel: { fontSize: 14, color: fig.textHigh, ...font('500'), flex: 1 },
  // Keep the JDS Button's token sizing (medium/48-tall) but override its purple
  // fill to the sheet's indigo so the CTA matches the rest of this Figma screen.
  cta: { alignSelf: 'stretch', alignItems: 'center', backgroundColor: fig.brand },
  secondary: { paddingVertical: 12, marginTop: 2 },
  secondaryText: { fontSize: 14, fontWeight: '700', color: fig.textLow, ...font('700') },
});
