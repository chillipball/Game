import { useCallback, useEffect, useRef } from "react";
import { getAudioContext } from "../lib/audioContext.js";

interface OrbAudioHandles {
  getInputVolume: () => number;
  getOutputVolume: () => number;
  connectMicrophone: () => Promise<void>;
  connectTTSBuffer: (buffer: ArrayBuffer) => void;
}

export function useOrbAudio(): OrbAudioHandles {
  const inputAnalyser = useRef<AnalyserNode | null>(null);
  const outputAnalyser = useRef<AnalyserNode | null>(null);
  const inputData = useRef<Uint8Array>(new Uint8Array(0));
  const outputData = useRef<Uint8Array>(new Uint8Array(0));

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      inputAnalyser.current?.disconnect();
      outputAnalyser.current?.disconnect();
    };
  }, []);

  const getVolume = (analyser: AnalyserNode | null, data: Uint8Array): number => {
    if (!analyser) return 0;
    analyser.getByteFrequencyData(data);
    const sum = data.reduce((acc, val) => acc + val, 0);
    return Math.min(sum / data.length / 255, 1);
  };

  const getInputVolume = useCallback(
    () => getVolume(inputAnalyser.current, inputData.current),
    [],
  );
  const getOutputVolume = useCallback(
    () => getVolume(outputAnalyser.current, outputData.current),
    [],
  );

  const connectMicrophone = useCallback(async () => {
    const ctx = getAudioContext();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    inputAnalyser.current = analyser;
    inputData.current = new Uint8Array(analyser.frequencyBinCount);
  }, []);

  const connectTTSBuffer = useCallback((buffer: ArrayBuffer) => {
    const ctx = getAudioContext();
    ctx.decodeAudioData(buffer.slice(0), (decoded) => {
      const source = ctx.createBufferSource();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.buffer = decoded;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      source.start();
      outputAnalyser.current = analyser;
      outputData.current = new Uint8Array(analyser.frequencyBinCount);
    });
  }, []);

  return { getInputVolume, getOutputVolume, connectMicrophone, connectTTSBuffer };
}
