/* The Saathi avatar's Lottie states — segments of one master purple animation.
   Steady states loop; the two transitions play once and settle on their last
   frame (the scene switches to the next steady state when it's ready). Shared by
   AvatarView (native) and AvatarView.web so both resolve the same requires. */
export type AvatarState =
  | 'idle'
  | 'idleToListening'
  | 'listening'
  | 'listeningToThinking'
  | 'thinking'
  | 'speaking';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const AVATAR_SOURCES: Record<AvatarState, any> = {
  idle: require('../../../assets/lottie/av-idle.json'),
  idleToListening: require('../../../assets/lottie/av-idle-to-listening.json'),
  listening: require('../../../assets/lottie/av-listening.json'),
  listeningToThinking: require('../../../assets/lottie/av-listening-to-thinking.json'),
  thinking: require('../../../assets/lottie/av-thinking.json'),
  speaking: require('../../../assets/lottie/av-speaking.json'),
};

export const AVATAR_LOOPS: Record<AvatarState, boolean> = {
  idle: true,
  listening: true,
  thinking: true,
  speaking: true,
  idleToListening: false,
  listeningToThinking: false,
};

// Duration (ms) of the one-shot transition clips, from their frame ranges at 30fps.
export const AVATAR_TRANSITION_MS: Record<'idleToListening' | 'listeningToThinking', number> = {
  idleToListening: Math.round(((170 - 120) / 30) * 1000), // ~1667
  listeningToThinking: Math.round(((271 - 240) / 30) * 1000), // ~1033
};
