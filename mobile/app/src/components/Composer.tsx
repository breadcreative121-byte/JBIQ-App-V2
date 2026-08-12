/* The persistent bottom "Ask anything" composer from Figma (JDS ChatInput).
   A lilac "+" button and a grey input pill with a trailing indigo action button
   that lives *inside* the pill: voice bars when empty (opens Saathi voice), and
   an up-arrow "send" once the user starts typing. The two icons crossfade so the
   resting → typing change (Figma 172:2515) is smooth. Reverts when the field
   empties. Shared by Home and every Space. */
import { useRef, useState } from 'react';
import { View, TextInput, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fig } from '@/theme/figma';
import { font } from '@/theme/fonts';

export function Composer({
  onMic,
  onSubmit,
  onPlus,
}: {
  onMic: () => void;
  onSubmit?: (text: string) => void;
  onPlus?: () => void;
}) {
  const [value, setValue] = useState('');
  const hasText = value.trim().length > 0;
  // 0 = resting (mic / voice bars), 1 = typing (send arrow).
  const t = useRef(new Animated.Value(0)).current;

  const animateTo = (to: number) =>
    Animated.timing(t, {
      toValue: to,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

  const onChange = (text: string) => {
    const wasEmpty = value.trim().length === 0;
    const nowEmpty = text.trim().length === 0;
    setValue(text);
    if (wasEmpty !== nowEmpty) animateTo(nowEmpty ? 0 : 1);
  };

  const submit = () => {
    const v = value.trim();
    if (v && onSubmit) onSubmit(v);
    setValue('');
    animateTo(0);
  };

  const onTrailing = () => {
    if (hasText) submit();
    else onMic();
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={onPlus}
        accessibilityRole="button"
        accessibilityLabel="Add"
        style={styles.plus}
      >
        <Ionicons name="add" size={24} color={fig.brand} />
      </Pressable>

      <View style={styles.pill}>
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Ask anything"
          placeholderTextColor={fig.textLow}
          returnKeyType="send"
          onSubmitEditing={submit}
          style={styles.input}
        />
        <Pressable
          onPress={onTrailing}
          accessibilityRole="button"
          accessibilityLabel={hasText ? 'Send' : 'Speak'}
          hitSlop={8}
          style={styles.action}
        >
          {/* Voice bars — visible when empty */}
          <Animated.View
            style={[
              styles.iconLayer,
              {
                opacity: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
                transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [1, 0.5] }) }],
              },
            ]}
          >
            <VoiceBars />
          </Animated.View>
          {/* Send arrow — visible when typing */}
          <Animated.View
            style={[
              styles.iconLayer,
              {
                opacity: t.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
                transform: [{ scale: t.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
              },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color={fig.textOnBrand} />
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
}

function VoiceBars() {
  const heights = [6, 11, 16, 10, 7];
  return (
    <View style={styles.bars}>
      {heights.map((h, i) => (
        <View key={i} style={[styles.voiceBar, { height: h }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plus: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: fig.lilac,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // The grey pill wraps the text input + trailing action button (JDS collapsed).
  pill: {
    flex: 1,
    minHeight: 42,
    borderRadius: 24,
    backgroundColor: fig.surfaceGhost,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 5,
    paddingVertical: 5,
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 0,
    fontSize: 16,
    color: fig.textHigh,
    ...font('400'),
  },
  action: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: fig.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bars: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 16 },
  voiceBar: { width: 2.5, borderRadius: 2, backgroundColor: fig.textOnBrand },
});
