import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';
import Svg, { Defs, ClipPath, LinearGradient, Stop, Rect, Text as SvgText } from 'react-native-svg';
import { familyFor } from '@/theme/fonts';

/* A status label (e.g. "Listening…" / "Thinking") with a light band that sweeps
   across the glyphs. Base text sits underneath; a translucent white gradient
   Rect — clipped to the same text via ClipPath — glides left→right on an
   Animated loop. `align='start'` left-anchors the text (for an inline row).
   Built on react-native-svg; no native module. */

const AnimatedRect = Animated.createAnimatedComponent(Rect);

const H = 22;
const BAND = 64;
// SVG <text> with no font-family falls back to the browser default (serif) on web,
// which mismatches the app's sans UI. When JioType isn't bundled, pin the system
// sans stack on web so "Listening…"/"Thinking…" match everything else. Native is
// left to its own system default (undefined) as before.
const WEB_SANS =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const FAMILY = familyFor('500') ?? (Platform.OS === 'web' ? WEB_SANS : undefined);

export function ListeningLabel({
  text = 'Listening…',
  color = '#0c0d10',
  width = 180,
  align = 'center',
}: {
  text?: string;
  color?: string;
  width?: number;
  align?: 'center' | 'start';
}) {
  const x = useRef(new Animated.Value(-BAND)).current;

  useEffect(() => {
    x.setValue(-BAND);
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: width,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // SVG props aren't native-drivable
        }),
        Animated.delay(500),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [x, text, width]);

  const common = {
    x: align === 'start' ? 0 : width / 2,
    y: 16,
    fontSize: 14,
    fontWeight: '500' as const,
    textAnchor: (align === 'start' ? 'start' : 'middle') as 'start' | 'middle',
    ...(FAMILY ? { fontFamily: FAMILY } : {}),
  };

  return (
    <View style={[styles.wrap, { width }]} accessibilityRole="text" accessibilityLabel={text}>
      <Svg width={width} height={H}>
        <Defs>
          <ClipPath id="listen-clip">
            <SvgText {...common}>{text}</SvgText>
          </ClipPath>
          <LinearGradient id="listen-shine" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <Stop offset="0.5" stopColor="#ffffff" stopOpacity="0.9" />
            <Stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <SvgText {...common} fill={color}>
          {text}
        </SvgText>
        <AnimatedRect
          x={x}
          y={0}
          width={BAND}
          height={H}
          fill="url(#listen-shine)"
          clipPath="url(#listen-clip)"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: H, justifyContent: 'center' },
});
