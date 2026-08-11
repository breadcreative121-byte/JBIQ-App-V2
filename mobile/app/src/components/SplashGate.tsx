/* Animated brand splash. Plays the Jio masterbrand Lottie (3s) full-screen over
   a deep-indigo background matching the animation's own BG, then calls onDone so
   the app is revealed. onLayout fires onReady so the caller can hide the native
   splash for a seamless handoff. */
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import splash from '../../assets/lottie/jio-splash.json';

export function SplashGate({ onReady, onDone }: { onReady?: () => void; onDone: () => void }) {
  // Safety net in case onAnimationFinish never fires.
  useEffect(() => {
    const t = setTimeout(onDone, 3600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <View style={styles.fill} onLayout={() => onReady?.()}>
      <LottieView
        source={splash}
        autoPlay
        loop={false}
        resizeMode="cover"
        onAnimationFinish={() => onDone()}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#170054', zIndex: 100 },
});
