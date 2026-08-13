/* A vector diya flame for the Festive Home (193:3924) — transparent background,
   gold outer + pale-yellow core, with a gentle looping flicker (subtle vertical
   stretch, sway and glow). Pass a `delay`/`duration` so the two flames breathe
   out of sync. Purely decorative. */
import { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fig } from '@/theme/figma';

export function FestiveFlame({
  style,
  delay = 0,
  duration = 720,
}: {
  style?: StyleProp<ViewStyle>;
  delay?: number;
  duration?: number;
}) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(t, { toValue: 1, duration, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(t, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [t, delay, duration]);

  const scaleY = t.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.09] });
  const scaleX = t.interpolate({ inputRange: [0, 1], outputRange: [1.03, 0.97] });
  const translateY = t.interpolate({ inputRange: [0, 1], outputRange: [0, -2] });
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  const opacity = t.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] });

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY }, { rotate }, { scaleX }, { scaleY }] }]}
      pointerEvents="none"
    >
      <Svg width="100%" height="100%" viewBox="0 0 32 48">
        {/* Outer flame */}
        <Path
          d="M16 2 C 20 12, 28 18, 28 30 C 28 40, 23 46, 16 46 C 9 46, 4 40, 4 30 C 4 17, 12 13, 16 2 Z"
          fill={fig.marigold}
        />
        {/* Inner core */}
        <Path
          d="M16 15 C 18.5 20, 22 24, 22 31 C 22 37.5, 19 41, 16 41 C 13 41, 10 37.5, 10 31 C 10 24, 13.5 20, 16 15 Z"
          fill="#ffeba5"
        />
      </Svg>
    </Animated.View>
  );
}
