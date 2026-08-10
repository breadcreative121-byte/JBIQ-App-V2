import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { Asset } from 'expo-asset';
import * as api from '@/api/client';
import { ApiError } from '@/api/client';
import type { ChatMessage } from '@/api/types';
import { useAudioCues } from './useAudioCues';
import { useTtsPlayer } from './useTtsPlayer';
import type { ConversationState, TranscriptItem } from './types';

let counter = 0;
const uid = () => `${Date.now()}-${counter++}`;

function friendlyError(err: unknown): string {
  if (err instanceof ApiError && err.status === 408) {
    return 'That took longer than it should have.';
  }
  return 'Couldn’t reach Saathi just now.';
}

export function useConversation() {
  const [state, setState] = useState<ConversationState>('idle');
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const messagesRef = useRef<ChatMessage[]>([]);
  const resumeRef = useRef(false);

  const cue = useAudioCues();
  const player = useTtsPlayer({
    onStart: () => setState('speaking'),
    onDone: () => setState('idle'),
  });

  const pushItem = useCallback((item: TranscriptItem) => {
    setTranscript((prev) => [...prev, item]);
  }, []);

  // Interruption: silence the assistant the moment the user acts. `ack` plays the
  // understood cue (skip it when the mic's own cue already acknowledges).
  const interrupt = useCallback(
    (ack = true) => {
      if (player.isPlaying()) {
        player.stop();
        if (ack) cue('va-understood');
        setState('idle');
      }
    },
    [player, cue],
  );

  // Asks the backend for the assistant reply for the current message list, then
  // plays its TTS. Shared by send() (new turn) and retry() (repair).
  const runTurn = useCallback(async () => {
    setState('sending');
    try {
      const { text: reply } = await api.chat(messagesRef.current);
      messagesRef.current = [...messagesRef.current, { role: 'assistant', content: reply }];
      pushItem({ id: uid(), kind: 'assistant', text: reply });
      setState('thinking');
      try {
        const { uri } = await api.tts(reply);
        player.play(uri);
      } catch {
        setState('idle'); // text is shown; voice is best-effort
      }
    } catch (err) {
      setState('error');
      cue('info-warning');
      pushItem({ id: uid(), kind: 'error', text: friendlyError(err) });
    }
  }, [player, cue, pushItem]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      interrupt();
      cue('message-sent');
      pushItem({ id: uid(), kind: 'user', text });
      messagesRef.current = [...messagesRef.current, { role: 'user', content: text }];
      await runTurn();
    },
    [interrupt, cue, pushItem, runTurn],
  );

  // Speak an arbitrary line and resolve when it finishes — the building block for
  // the scripted first-run scene. State goes thinking → speaking → idle via the
  // player handlers; a TTS failure resolves silently so captions still carry on.
  const speak = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      setState('thinking');
      try {
        const { uri } = await api.tts(text);
        await player.play(uri);
      } catch {
        setState('idle'); // no audio; the caller proceeds regardless
      }
    },
    [player],
  );

  // Speak a bundled audio clip (a pre-recorded line) with the same states/await
  // as speak(). Resolves the require()'d asset to a URI so it plays on native and
  // web through the one player.
  const speakClip = useCallback(
    async (mod: number) => {
      setState('thinking');
      try {
        const asset = Asset.fromModule(mod);
        if (!asset.downloaded) await asset.downloadAsync();
        await player.play(asset.localUri ?? asset.uri);
      } catch {
        setState('idle'); // no audio; the caller proceeds regardless
      }
    },
    [player],
  );

  // Record the user's request bubble and play the small "sent" cue. Split out so
  // the scene can stagger the card in after it (and let the cue finish before the
  // task-complete voiceover).
  const pushUser = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      cue('message-sent');
      pushItem({ id: uid(), kind: 'user', text });
      messagesRef.current = [...messagesRef.current, { role: 'user', content: text }];
    },
    [cue, pushItem],
  );

  // Pull up the scripted "live darshan" widget. No TTS here — the scene controls
  // the spoken lines around it.
  const showDarshanCard = useCallback(() => {
    pushItem({ id: uid(), kind: 'assistant', text: 'Live darshan — Kashi Vishwanath', card: 'darshan' });
    messagesRef.current = [
      ...messagesRef.current,
      { role: 'assistant', content: 'Showed the live Kashi Vishwanath darshan.' },
    ];
  }, [pushItem]);

  // One-shot: user bubble + card together (used by the barge-in skip path).
  const showDarshan = useCallback(
    (userText?: string) => {
      if (userText?.trim()) pushUser(userText);
      showDarshanCard();
    },
    [pushUser, showDarshanCard],
  );

  // Prototype: push the user's message and sit in "thinking" forever — never
  // calls the backend, so no reply appears. Used for tapped Home prompts.
  const sendPrototype = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text) return;
      interrupt();
      cue('message-sent');
      pushItem({ id: uid(), kind: 'user', text });
      messagesRef.current = [...messagesRef.current, { role: 'user', content: text }];
      setState('thinking');
    },
    [interrupt, cue, pushItem],
  );

  // Repair: drop the trailing error bubble and re-run the same pending turn.
  const retry = useCallback(async () => {
    setTranscript((prev) => prev.filter((i) => i.kind !== 'error'));
    await runTurn();
  }, [runTurn]);

  const clear = useCallback(() => {
    player.stop();
    messagesRef.current = [];
    setTranscript([]);
    setState('idle');
  }, [player]);

  // Resumption: if we get backgrounded mid-speech, stop and remember; on return,
  // announce we're picking up and replay the last assistant clip.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background' || next === 'inactive') {
        if (player.isPlaying()) {
          player.stop();
          resumeRef.current = true;
        }
      } else if (next === 'active' && resumeRef.current) {
        resumeRef.current = false;
        pushItem({ id: uid(), kind: 'assistant', text: 'Picking up where we left off…' });
        player.replayLast();
      }
    });
    return () => sub.remove();
  }, [player, pushItem]);

  return {
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
    clear,
    interrupt,
    cue,
  };
}
