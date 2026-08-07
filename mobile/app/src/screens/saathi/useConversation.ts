import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
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

  return { state, transcript, send, sendPrototype, retry, clear, interrupt, cue };
}
