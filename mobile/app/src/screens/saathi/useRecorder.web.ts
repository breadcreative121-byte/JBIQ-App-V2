import { useCallback, useRef, useState } from 'react';
import { stt } from '@/api/client';
import type { SttResult } from '@/api/types';

// Web build of the recorder. The browser's MediaRecorder yields webm/opus, which
// Sarvam STT won't take, so we capture raw PCM via the Web Audio API and encode a
// 16 kHz mono 16-bit WAV in-browser — matching what useRecorder.ts records on iOS.
// Same surface as the native hook: start() / stopAndTranscribe() / recording.
const TARGET_RATE = 16000;

export function useRecorder() {
  const [recording, setRecording] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nodeRef = useRef<ScriptProcessorNode | null>(null);
  const chunksRef = useRef<Float32Array[]>([]);
  const inputRateRef = useRef(48000);

  const teardown = useCallback(() => {
    try {
      nodeRef.current?.disconnect();
    } catch {
      // ignore
    }
    try {
      sourceRef.current?.disconnect();
    } catch {
      // ignore
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    const ctx = ctxRef.current;
    if (ctx && ctx.state !== 'closed') void ctx.close().catch(() => {});
    nodeRef.current = null;
    sourceRef.current = null;
    streamRef.current = null;
    ctxRef.current = null;
  }, []);

  const start = useCallback(async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const Ctor: typeof AudioContext =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      ctxRef.current = ctx;
      if (ctx.state === 'suspended') await ctx.resume();
      inputRateRef.current = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;
      const node = ctx.createScriptProcessor(4096, 1, 1);
      nodeRef.current = node;
      chunksRef.current = [];
      node.onaudioprocess = (e) => {
        // Copy — the underlying buffer is reused across callbacks.
        chunksRef.current.push(new Float32Array(e.inputBuffer.getChannelData(0)));
      };
      source.connect(node);
      node.connect(ctx.destination);
      setRecording(true);
      return true;
    } catch {
      teardown();
      return false;
    }
  }, [teardown]);

  const stopAndTranscribe = useCallback(async (): Promise<SttResult | null> => {
    if (!recording) return null;
    setRecording(false);
    const inputRate = inputRateRef.current;
    const merged = mergeChunks(chunksRef.current);
    chunksRef.current = [];
    teardown();
    if (merged.length === 0) return null;
    const pcm = downsample(merged, inputRate, TARGET_RATE);
    const wav = encodeWav(pcm, TARGET_RATE);
    const base64 = arrayBufferToBase64(wav);
    return stt(base64);
  }, [recording, teardown]);

  return { start, stopAndTranscribe, recording };
}

function mergeChunks(chunks: Float32Array[]): Float32Array {
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Float32Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

// Linear-interpolation downsample from the browser's native rate (44.1/48 kHz) to
// 16 kHz. Good enough for speech; keeps the payload small for the STT endpoint.
function downsample(input: Float32Array, inRate: number, outRate: number): Float32Array {
  if (outRate >= inRate) return input;
  const ratio = inRate / outRate;
  const outLength = Math.floor(input.length / ratio);
  const out = new Float32Array(outLength);
  for (let i = 0; i < outLength; i++) {
    const pos = i * ratio;
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, input.length - 1);
    const frac = pos - lo;
    out[i] = input[lo] * (1 - frac) + input[hi] * frac;
  }
  return out;
}

// 16-bit PCM mono WAV.
function encodeWav(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // audio format = PCM
  view.setUint16(22, 1, true); // channels = mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}
