import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import lottie, { type AnimationItem } from 'lottie-web';
import { AVATAR_SOURCES, AVATAR_LOOPS, type AvatarState } from './avatarSources';

// Web build of the Saathi orb. lottie-react-native has no web renderer, so we
// drive lottie-web against a <div>, reloading whenever the state (and thus the
// clip / loop) changes so each state plays from its first frame.
export function AvatarView({
  state = 'listening',
  source,
  size = 58,
}: {
  state?: AvatarState;
  source?: unknown;
  size?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);

  const src = source ?? AVATAR_SOURCES[state];
  const loop = source ? true : AVATAR_LOOPS[state];

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop,
      autoplay: true,
      animationData: src as Record<string, unknown>,
    });
    animRef.current = anim;
    return () => {
      anim.destroy();
      animRef.current = null;
    };
  }, [src, loop]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <div ref={containerRef} style={{ width: size, height: size }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
