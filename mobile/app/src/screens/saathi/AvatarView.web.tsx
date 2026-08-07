import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import lottie, { type AnimationItem } from 'lottie-web';

// Web build of the Lottie orb. lottie-react-native has no web renderer, so we
// drive lottie-web against a <div>. On web, require('*.json') resolves to the
// parsed animation object, so the same `source` prop works as on native.
const LISTENING = require('../../../assets/lottie/listening.json');

export function AvatarView({
  thinking = false,
  source = LISTENING,
  size = 58,
}: {
  thinking?: boolean;
  source?: unknown;
  size?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: source as Record<string, unknown>,
    });
    animRef.current = anim;
    anim.setSpeed(thinking ? 1.4 : 1);
    return () => {
      anim.destroy();
      animRef.current = null;
    };
  }, [source]);

  useEffect(() => {
    animRef.current?.setSpeed(thinking ? 1.4 : 1);
  }, [thinking]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <div ref={containerRef} style={{ width: size, height: size }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
