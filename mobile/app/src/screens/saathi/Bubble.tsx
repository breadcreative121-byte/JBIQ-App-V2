import { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text } from 'react-native';
import { color, radius, space } from '@theme';
import { text as type } from '@/theme/typography';
import type { TranscriptItem } from './types';

// A chat bubble that fades + slides up on mount (the "transition in").
export function Bubble({ item, onRetry }: { item: TranscriptItem; onRetry?: () => void }) {
  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);
  const animStyle = {
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
  };

  if (item.kind === 'error') {
    return (
      <Animated.View style={[styles.row, styles.left, animStyle]}>
        <Pressable onPress={onRetry} style={[styles.bubble, styles.errorBubble]}>
          <Text style={[type.bodyM, { color: color.white }]}>{item.text}</Text>
          <Text style={[type.labelS, styles.retry]}>Retry</Text>
        </Pressable>
      </Animated.View>
    );
  }

  const isUser = item.kind === 'user';
  return (
    <Animated.View style={[styles.row, isUser ? styles.right : styles.left, animStyle]}>
      <Animated.View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[type.bodyM, { color: color.textHigh }]}>{item.text}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { width: '100%', marginVertical: space['3xs'], flexDirection: 'row' },
  left: { justifyContent: 'flex-start' },
  right: { justifyContent: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: space.m,
    paddingVertical: space.s,
    borderRadius: radius.shapeLg,
  },
  userBubble: {
    backgroundColor: color.surfaceMinimal,
    borderRadius: radius.shapeXl,
    borderBottomRightRadius: radius.shapeXs,
  },
  assistantBubble: { backgroundColor: color.surfaceMinimal, borderBottomLeftRadius: radius.shapeXs },
  errorBubble: { backgroundColor: color.error },
  retry: { color: color.white, marginTop: space['2xs'], textDecorationLine: 'underline' },
});
