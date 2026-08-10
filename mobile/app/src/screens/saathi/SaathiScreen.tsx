import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import type { AvatarState } from './avatarSources';
import { ListeningLabel } from './ListeningLabel';
import { ThinkingRow } from './ThinkingRow';
import { Bubble } from './Bubble';
import { Transcript } from './Transcript';
import { Composer } from './Composer';
import { FirstRunStage } from './FirstRunStage';
import { useFirstRunScene, FIRST_TASK_PHRASE } from './useFirstRunScene';
import { useConversation } from './useConversation';
import { font } from '@/theme/fonts';
import type { RootStackParamList } from '@/navigation/RootStack';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Saathi'>;

export function SaathiScreen() {
  const navigation = useNavigation<Nav>();
  const {
    state,
    transcript,
    send,
    sendPrototype,
    speak,
    speakClip,
    pushUser,
    showDarshanCard,
    showDarshan,
    retry,
    interrupt,
    clear,
    cue,
  } = useConversation();
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

  // First-run onboarding: an assistant-led scene (intro → invite → darshan
  // widget → closing). Turn 2 onward is the real assistant.
  const firstRun = route.params?.coach === 'firstRun';
  const conv = useMemo(
    () => ({ speak, speakClip, pushUser, showDarshanCard, showDarshan, interrupt }),
    [speak, speakClip, pushUser, showDarshanCard, showDarshan, interrupt],
  );
  const scene = useFirstRunScene(conv);

  const sceneStarted = useRef(false);
  useEffect(() => {
    if (firstRun && !sceneStarted.current) {
      sceneStarted.current = true;
      scene.start();
    }
  }, [firstRun, scene.start]);

  // While the scene is inviting the first task, route input to it; afterwards
  // it's a normal live turn.
  const handleTurn = useCallback(
    (t: string) => {
      if (firstRun && (scene.stage === 'intro' || scene.stage === 'awaitUser')) {
        scene.confirmFirstTask(t);
      } else {
        send(t);
      }
    },
    [firstRun, scene, send],
  );

  const thinking = state === 'sending' || state === 'thinking';
  const speaking = state === 'speaking';
  const busy = thinking;

  // The voice orb + status show while listening / working, and as the resting
  // state when the conversation is still empty (matches Figma 152:6323).
  // Keep the orb on screen for the whole scripted scene (so the speaking →
  // listening settle doesn't blink out mid-transition) and after it ends.
  const sceneEnded = firstRun && scene.stage === 'done';
  const active = listening || thinking || speaking;
  const showVoice = active || transcript.length === 0 || (firstRun && scene.active) || sceneEnded;
  const label = listening
    ? 'Listening…'
    : thinking
      ? 'Thinking…'
      : speaking
        ? 'Speaking…'
        : 'Listening…';

  // During the first-run scene the avatar is scripted (speaking → idle →
  // idle-to-listening → listening, etc.); otherwise it tracks live voice state.
  const avatarState: AvatarState =
    firstRun && scene.active
      ? scene.avatar
      : listening
        ? 'listening'
        : thinking
          ? 'thinking'
          : speaking
            ? 'speaking'
            : sceneEnded
              ? 'listening'
              : 'idle';

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
              {firstRun && transcript.length === 0 ? (
                <FirstRunStage
                  phraseVisible={scene.phraseVisible}
                  onSuggested={() => scene.confirmFirstTask(FIRST_TASK_PHRASE)}
                  onSkip={scene.skip}
                />
              ) : (
                <Transcript items={transcript} onRetry={retry} anchorTop={firstRun} />
              )}
            </View>
            {showVoice ? (
              <View style={styles.voice} pointerEvents="none">
                <AvatarView state={avatarState} />
                <ListeningLabel text={label} />
              </View>
            ) : null}
          </>
        )}

        <Composer
          cue={cue}
          onSend={handleTurn}
          onMicStart={() => interrupt(false)}
          onTranscript={handleTurn}
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

      {sceneEnded ? (
        <View style={styles.endTip} pointerEvents="none">
          <Text style={styles.endTipText}>End chat</Text>
          <View style={styles.endTipCaret} />
        </View>
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
  endTip: {
    position: 'absolute',
    right: 14,
    bottom: 84,
    backgroundColor: color.neutral100,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    zIndex: 20,
  },
  endTipText: { color: color.white, fontSize: 12.5, ...font('700') },
  endTipCaret: {
    position: 'absolute',
    bottom: -6,
    right: 18,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: color.neutral100,
  },
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
