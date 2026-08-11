/* Web build of the brand splash. lottie-react-native has no web renderer, so we
   drive lottie-web against a <div> (SVG, slice-to-cover), then call onDone on
   'complete'. Matches SplashGate.tsx's behaviour. */
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import lottie, { type AnimationItem } from 'lottie-web';
import splash from '../../assets/lottie/jio-splash.json';

export function SplashGate({ onReady, onDone }: { onReady?: () => void; onDone: () => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onReady?.();
    if (!containerRef.current) {
      onDone();
      return;
    }
    const anim: AnimationItem = lottie.loadAnimation({
      container: containerRef.current,
      renderer: 'svg',
      loop: false,
      autoplay: true,
      animationData: splash as unknown as Record<string, unknown>,
      rendererSettings: { preserveAspectRatio: 'xMidYMid slice' },
    });
    anim.addEventListener('complete', onDone);
    const t = setTimeout(onDone, 3600); // safety net
    return () => {
      clearTimeout(t);
      anim.destroy();
    };
  }, [onReady, onDone]);

  return (
    <View style={styles.fill}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#170054', zIndex: 100 },
});
