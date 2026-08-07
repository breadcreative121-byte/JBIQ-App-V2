// Explicit conversation state machine. The avatar video and mic button derive
// their appearance from this, so keep transitions deliberate.
export type ConversationState = 'idle' | 'sending' | 'thinking' | 'speaking' | 'error';

export type TranscriptItem =
  | { id: string; kind: 'user'; text: string }
  | { id: string; kind: 'assistant'; text: string }
  | { id: string; kind: 'error'; text: string };

export type CueId =
  | 'wakeup'
  | 'welcome'
  | 'va-understood'
  | 'message-sent'
  | 'mic-on'
  | 'mic-off'
  | 'info-warning'
  | 'pay-success';
