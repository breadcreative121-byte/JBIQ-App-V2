import { useCallback, useState } from 'react';
import {
  useAudioRecorder,
  setAudioModeAsync,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  RecordingPresets,
  IOSOutputFormat,
  AudioQuality,
  type RecordingOptions,
} from 'expo-audio';
import { File } from 'expo-file-system';
import { stt } from '@/api/client';
import type { SttResult } from '@/api/types';

// Sarvam STT wants WAV/mp3; the default preset records .m4a. Force 16 kHz mono
// LINEAR PCM (.wav) on iOS — small and universally accepted by the STT API.
const WAV_RECORDING: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: '.wav',
  sampleRate: 16000,
  numberOfChannels: 1,
  ios: {
    ...RecordingPresets.HIGH_QUALITY.ios,
    extension: '.wav',
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.HIGH,
    sampleRate: 16000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
};

export function useRecorder() {
  const recorder = useAudioRecorder(WAV_RECORDING);
  const [recording, setRecording] = useState(false);

  const ensurePermission = useCallback(async () => {
    const current = await getRecordingPermissionsAsync();
    if (current.granted) return true;
    const requested = await requestRecordingPermissionsAsync();
    return requested.granted;
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    if (!(await ensurePermission())) return false;
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecording(true);
    return true;
  }, [ensurePermission, recorder]);

  // Stops, reads the clip as base64, and returns the Sarvam transcript. Restores
  // the audio session to playback so the assistant TTS comes out the speaker.
  const stopAndTranscribe = useCallback(async (): Promise<SttResult | null> => {
    if (!recording) return null;
    await recorder.stop();
    setRecording(false);
    await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    const uri = recorder.uri;
    if (!uri) return null;
    const base64 = await new File(uri).base64();
    return stt(base64);
  }, [recording, recorder]);

  return { start, stopAndTranscribe, recording };
}
