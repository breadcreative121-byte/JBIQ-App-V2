/* First-run interest selection persistence. Mirrors onboarding.ts: a single
   AsyncStorage key holding the chosen interest ids. `null` means the user hasn't
   picked yet (first run). The demo replays the picker every launch but the real
   selection is still written so a production build could skip it. */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { InterestId } from './interests';

const KEY = 'jbiq_prefs_v1';

export async function getPreferences(): Promise<InterestId[] | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as InterestId[]) : null;
  } catch {
    return null; // treat unreadable storage as "not chosen yet"
  }
}

export async function setPreferences(ids: InterestId[]): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // best-effort; a lost selection only means the picker shows again
  }
}

export async function clearPreferences(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // best-effort
  }
}
