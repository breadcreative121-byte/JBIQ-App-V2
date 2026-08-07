import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { space } from '@theme';
import { AvatarView } from './AvatarView';
import { ListeningLabel } from './ListeningLabel';

// The assistant-side "Thinking" indicator (Figma 152:6851): the thinking.json
// orb on the left with a shimmering "Thinking" beside it. Fades in on mount.
const THINKING = require('../../../assets/lottie/thinking.json');

export function ThinkingRow() {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // A beat after the user's message lands, then the thinking row eases in.
    Animated.timing(enter, {
      toValue: 1,
      duration: 320,
      delay: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.row,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
        },
      ]}
    >
      <AvatarView source={THINKING} size={44} />
      <ListeningLabel text="Thinking…" align="start" width={120} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingTop: space.s,
    paddingBottom: space['2xs'],
  },
});
