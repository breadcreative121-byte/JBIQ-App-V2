/* First-run persistence. The voice-onboarding flow (Permit → say-once → win)
   should run exactly once per install, so we persist a single flag to disk.
   AsyncStorage is the lightweight standard and works in Expo Go. */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'jbiq_onboarding_v1';
const SPACES_KEY = 'jbiq_spaces_intro_v1';

export async function getOnboardingComplete(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === '1';
  } catch {
    return false; // treat unreadable storage as first-run
  }
}

export async function setOnboardingComplete(value: boolean): Promise<void> {
  try {
    if (value) await AsyncStorage.setItem(KEY, '1');
    else await AsyncStorage.removeItem(KEY);
  } catch {
    // best-effort; a lost flag only means the intro may show again
  }
}

// The "Welcome to Spaces" educational sheet should appear once per install, not
// once per session — a returning user has already met Spaces.
export async function getSpacesIntroSeen(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SPACES_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function setSpacesIntroSeen(value: boolean): Promise<void> {
  try {
    if (value) await AsyncStorage.setItem(SPACES_KEY, '1');
    else await AsyncStorage.removeItem(SPACES_KEY);
  } catch {
    // best-effort
  }
}
