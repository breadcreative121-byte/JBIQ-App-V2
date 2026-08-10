/* Orchestrates the assistant-led first-run scene: Saathi introduces herself,
   invites the one task, waits ~4s for the user to tap/say it (else continues on
   her own), pulls up the darshan widget, and closes — then hands off to a normal
   live conversation or Home. Reuses the conversation's speak()/showDarshan()/cue
   so a single audio player and the real avatar states drive everything. */
import { useCallback, useRef, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { setOnboardingComplete } from '@/lib/onboarding';
import { AVATAR_TRANSITION_MS, type AvatarState } from './avatarSources';

// Pre-recorded voiceovers — the opening line, and the "task complete" line that
// plays when the darshan card lands.
const WELCOME_CLIP = require('../../../assets/audio/welcome-onboarding.mp3');
const TASK_COMPLETE_CLIP = require('../../../assets/audio/task-complete.mp3');

export const FIRST_TASK_PHRASE = 'Play live darshan';

const LINES = {
  intro: "Namaste — I'm Saathi. Let's do your first thing together. Just say: Play live darshan.",
};

const WAIT_MS = 4000;
const REVEAL_STAGGER_MS = 450; // slight stagger between the user bubble and the card
const SMALL_SOUND_MS = 550; // hold so the small "sent" sound plays before the voiceover

export type SceneStage = 'idle' | 'intro' | 'awaitUser' | 'reveal' | 'closing' | 'done';

type Conv = {
  speak: (text: string) => Promise<void>;
  speakClip: (mod: number) => Promise<void>;
  pushUser: (text: string) => void;
  showDarshanCard: () => void;
  showDarshan: (userText?: string) => void;
  interrupt: (ack?: boolean) => void;
};

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
// A readable floor per line, so captions hold long enough even when TTS audio is
// slow or blocked (e.g. in a browser). Native audio is usually longer and paces
// the scene naturally; this just prevents a silent rush.
const dwellFor = (text: string) => Math.min(4600, Math.max(1600, text.split(/\s+/).length * 260));

export function useFirstRunScene(conv: Conv) {
  const [stage, setStage] = useState<SceneStage>('idle');
  const [avatar, setAvatar] = useState<AvatarState>('idle');

  const started = useRef(false);
  const cancelled = useRef(false);
  const waitResolve = useRef<((text: string | null) => void) | null>(null);
  const waitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWait = useCallback(() => {
    if (waitTimer.current) {
      clearTimeout(waitTimer.current);
      waitTimer.current = null;
    }
    waitResolve.current = null;
  }, []);

  const reveal = useCallback(
    async (userText: string | null) => {
      setStage('reveal');
      setAvatar('listeningToThinking');
      await delay(AVATAR_TRANSITION_MS.listeningToThinking);
      if (cancelled.current) return;
      setAvatar('thinking');
      conv.pushUser(userText ?? FIRST_TASK_PHRASE); // user bubble + small "sent" sound
      await delay(REVEAL_STAGGER_MS); // slight stagger before the card appears
      if (cancelled.current) return;
      conv.showDarshanCard(); // the card lands
      // Bring the speaking avatar on screen, but let the small sound finish first,
      // then play the recorded "task complete" voiceover.
      setAvatar('speaking');
      setOnboardingComplete(true);
      await delay(SMALL_SOUND_MS);
      if (cancelled.current) return;
      await Promise.all([conv.speakClip(TASK_COMPLETE_CLIP), delay(1500)]);
      if (cancelled.current) return;
      // Once the audio ends, settle into listening (same smooth chain as the
      // intro) and stay there — ready for the user to keep talking or end.
      setAvatar('idle');
      await delay(500);
      if (cancelled.current) return;
      setAvatar('idleToListening');
      await delay(AVATAR_TRANSITION_MS.idleToListening);
      if (cancelled.current) return;
      setAvatar('listening');
      setStage('done');
    },
    [conv],
  );

  const start = useCallback(async () => {
    if (started.current) return;
    started.current = true;
    cancelled.current = false;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    setStage('intro');
    setAvatar('speaking');
    await Promise.all([conv.speakClip(WELCOME_CLIP), delay(dwellFor(LINES.intro))]);
    if (cancelled.current) return;

    // Requested intro chain: once the welcome audio ends, settle to idle, play
    // the idle→listening transition, then loop listening as she waits.
    setAvatar('idle');
    await delay(500);
    if (cancelled.current) return;
    setAvatar('idleToListening');
    await delay(AVATAR_TRANSITION_MS.idleToListening);
    if (cancelled.current) return;
    setAvatar('listening');

    setStage('awaitUser');
    const result = await new Promise<string | null>((resolve) => {
      waitResolve.current = resolve;
      waitTimer.current = setTimeout(() => {
        waitResolve.current = null;
        resolve(null); // auto path
      }, WAIT_MS);
    });
    if (cancelled.current) return;

    await reveal(result); // result is the phrase, or null on the auto path
  }, [conv, reveal]);

  // The user tapped the phrase or spoke during the wait window.
  const confirmFirstTask = useCallback(
    (text?: string) => {
      const resolve = waitResolve.current;
      if (!resolve) return;
      clearWait();
      resolve(text?.trim() || FIRST_TASK_PHRASE);
    },
    [clearWait],
  );

  // Barge-in: stop narration, show the widget, jump to the closing CTAs.
  const skip = useCallback(() => {
    cancelled.current = true;
    const resolve = waitResolve.current;
    clearWait();
    resolve?.(null); // unblock a pending wait; cancelled guard stops the auto path
    conv.interrupt(false);
    conv.showDarshan(FIRST_TASK_PHRASE);
    setOnboardingComplete(true);
    setStage('done');
    setAvatar('idle');
  }, [conv, clearWait]);

  // "Keep talking" — leave the scene for a normal live conversation.
  const reset = useCallback(() => {
    cancelled.current = true;
    clearWait();
    setStage('idle');
    setAvatar('idle');
  }, [clearWait]);

  return {
    stage,
    avatar,
    phraseVisible: stage === 'awaitUser',
    active: stage !== 'idle' && stage !== 'done',
    start,
    confirmFirstTask,
    skip,
    reset,
  };
}
