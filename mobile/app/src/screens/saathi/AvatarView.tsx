import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

// A looping Lottie orb. Defaults to the "listening" dot-ring; pass a different
// `source` (e.g. thinking.json) and `size` to reuse it elsewhere. `thinking`
// just nudges the loop a touch faster.
const LISTENING = require('../../../assets/lottie/listening.json');

export function AvatarView({
  thinking = false,
  source = LISTENING,
  size = 58,
}: {
  thinking?: boolean;
  source?: any;
  size?: number;
}) {
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <LottieView
        source={source}
        autoPlay
        loop
        speed={thinking ? 1.4 : 1}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
