import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { color, space } from '@theme';
import { text as type } from '@/theme/typography';
import { AvatarView } from './AvatarView';
import { ListeningLabel } from './ListeningLabel';
import { ThinkingRow } from './ThinkingRow';
import { Bubble } from './Bubble';
import { Transcript } from './Transcript';
import { Composer } from './Composer';
import { useConversation } from './useConversation';
import type { RootStackParamList } from '@/navigation/RootStack';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Saathi'>;

export function SaathiScreen() {
  const navigation = useNavigation<Nav>();
  const { state, transcript, send, sendPrototype, retry, interrupt, clear, cue } = useConversation();
  const route = useRoute<RouteProp<RootStackParamList, 'Saathi'>>();
  const [listening, setListening] = useState(false);

  // Tapped Home prompts arrive as mode:'text' — a prototype that shows the
  // message + endless "Thinking" (no reply). Mic/voice entry stays real.
  const isText = route.params?.mode === 'text';

  // A tapped phrase / widget hands off its prompt — say it once on open.
  const sentPrompt = useRef(false);
  useEffect(() => {
    const prompt = route.params?.prompt;
    if (prompt && !sentPrompt.current) {
      sentPrompt.current = true;
      if (isText) sendPrototype(prompt);
      else send(prompt);
    }
  }, [route.params?.prompt, isText, send, sendPrototype]);

  const thinking = state === 'sending' || state === 'thinking';
  const speaking = state === 'speaking';
  const busy = thinking;

  // The voice orb + status show while listening / working, and as the resting
  // state when the conversation is still empty (matches Figma 152:6323).
  const active = listening || thinking || speaking;
  const showVoice = active || transcript.length === 0;
  const label = listening
    ? 'Listening…'
    : thinking
      ? 'Thinking…'
      : speaking
        ? 'Speaking…'
        : 'Listening…';

  const [toast, setToast] = useState<string | null>(null);
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (message: string) => {
      setToast(message);
      Animated.timing(toastOpacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => {
        Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }).start(
          () => setToast(null),
        );
      }, 3000);
    },
    [toastOpacity],
  );

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.circleBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="chevron-back" size={22} color={color.textHigh} />
          </Pressable>
          <Pressable
            onPress={clear}
            style={styles.circleBtn}
            accessibilityRole="button"
            accessibilityLabel="New chat"
          >
            <Ionicons name="create-outline" size={20} color={color.textHigh} />
          </Pressable>
        </View>

        {isText ? (
          // Prototype: message + Thinking pinned to the TOP of the page.
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.textContent}
            showsVerticalScrollIndicator={false}
            keyboardDismissMode="interactive"
          >
            {transcript.map((item) => (
              <Bubble key={item.id} item={item} onRetry={retry} />
            ))}
            {thinking ? <ThinkingRow /> : null}
          </ScrollView>
        ) : (
          <>
            <View style={styles.flex}>
              <Transcript items={transcript} onRetry={retry} />
            </View>
            {showVoice ? (
              <View style={styles.voice} pointerEvents="none">
                <AvatarView thinking={busy} />
                <ListeningLabel text={label} />
              </View>
            ) : null}
          </>
        )}

        <Composer
          cue={cue}
          onSend={send}
          onMicStart={() => interrupt(false)}
          onTranscript={send}
          onMicError={showToast}
          onListeningChange={setListening}
          onClose={() => navigation.goBack()}
          busy={busy}
        />
      </KeyboardAvoidingView>

      {toast ? (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]} pointerEvents="none">
          <Text style={[type.bodyS, { color: color.white }]}>{toast}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.surfaceDefault },
  flex: { flex: 1 },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space.m,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.surfaceMinimal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voice: { alignItems: 'center', gap: 8, paddingTop: space.s, paddingBottom: space['2xs'] },
  textContent: { paddingHorizontal: space.m, paddingTop: space.s },
  toast: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    maxWidth: '88%',
    backgroundColor: color.neutral100,
    paddingHorizontal: space.m,
    paddingVertical: space.s,
    borderRadius: 999,
  },
});
