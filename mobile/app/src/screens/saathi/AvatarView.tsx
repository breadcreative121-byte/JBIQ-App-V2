import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { AVATAR_SOURCES, AVATAR_LOOPS, type AvatarState } from './avatarSources';

// The Saathi orb. Pass a `state` to drive its animation (idle / listening /
// thinking / speaking + the two transitions); steady states loop, transitions
// play once. `source` stays supported as a legacy override (e.g. the permission
// sheet). Keyed by state so each change restarts the clip from its first frame.
export function AvatarView({
  state = 'listening',
  source,
  size = 58,
}: {
  state?: AvatarState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  source?: any;
  size?: number;
}) {
  const src = source ?? AVATAR_SOURCES[state];
  const loop = source ? true : AVATAR_LOOPS[state];
  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <LottieView
        key={source ? 'src' : state}
        source={src}
        autoPlay
        loop={loop}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
});
