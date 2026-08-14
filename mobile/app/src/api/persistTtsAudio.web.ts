// Web: expo-file-system's File/Paths write API isn't implemented for the browser,
// so wrap the mp3 bytes in an object URL the HTML <audio> element can play.
export function persistTtsAudio(bytes: Uint8Array): string {
  const blob = new Blob([bytes as BlobPart], { type: 'audio/mpeg' });
  return URL.createObjectURL(blob);
}
