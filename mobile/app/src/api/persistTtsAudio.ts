import { File, Paths } from 'expo-file-system';

// Native: the /api/tts endpoint is POST-only, so we can't stream it — persist the
// mp3 bytes to the cache dir and hand the audio player a file URI to load.
export function persistTtsAudio(bytes: Uint8Array): string {
  const file = new File(Paths.cache, `tts-${Date.now()}.mp3`);
  file.create({ overwrite: true });
  file.write(bytes);
  return file.uri;
}
