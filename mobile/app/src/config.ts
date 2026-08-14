import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dev: set EXPO_PUBLIC_API_BASE_URL in mobile/app/.env to your LAN IP, e.g.
//   EXPO_PUBLIC_API_BASE_URL=http://192.168.1.42:3000
// Prod: falls back to app.json extra.apiBaseUrl, then the Render URL.
//
// Web build: the page is served from the SAME origin as the API (…/app/ on
// Render), so default to same-origin relative requests (''). An explicit
// EXPO_PUBLIC_API_BASE_URL still wins for local web dev pointing at a separate
// backend — leave it UNSET when running `expo export` for production.
const envBase = process.env.EXPO_PUBLIC_API_BASE_URL || undefined;

export const API_BASE_URL =
  Platform.OS === 'web'
    ? (envBase ?? '')
    : (envBase ??
      (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
      'https://jbiq-app-v2.onrender.com');

// Per-request ceiling for backend calls (Anthropic / Sarvam can be slow).
export const REQUEST_TIMEOUT_MS = 20_000;
