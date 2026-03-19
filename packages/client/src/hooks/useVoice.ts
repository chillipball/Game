/**
 * Browser-native voice I/O — zero API cost.
 *
 * STT: Web Speech API (SpeechRecognition)
 * TTS: Web Speech API (SpeechSynthesis)
 *
 * Falls back gracefully if the browser doesn't support either.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { getSocketSync } from "../lib/socket.js";
import { SOCKET_EVENTS } from "@jarvis/shared";
import { useAssistantStore } from "../store/assistantStore.js";

interface UseVoiceOptions {
  /** Automatically read assistant responses aloud. Default: true */
  autoSpeak?: boolean;
}

interface UseVoiceReturn {
  supported: boolean;
  listening: boolean;
  speaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => void;
  cancelSpeech: () => void;
}

const SpeechRecognition =
  (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;

export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { autoSpeak = true } = options;
  const supported = !!SpeechRecognition && "speechSynthesis" in window;

  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null);
  const addUserMessage = useAssistantStore((s) => s.addUserMessage);

  // Auto-speak new assistant messages
  const messages = useAssistantStore((s) => s.messages);
  const lastSpokenId = useRef<string | null>(null);
  useEffect(() => {
    if (!autoSpeak || !supported) return;
    const last = messages[messages.length - 1];
    if (
      last &&
      last.role === "assistant" &&
      !last.isStreaming &&
      last.id !== lastSpokenId.current
    ) {
      lastSpokenId.current = last.id;
      speak(last.content);
    }
  });

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.onstart = () => setSpeaking(true);
    utt.onend = () => setSpeaking(false);
    utt.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, []);

  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const startListening = useCallback(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (e: any) => {
      const transcript: string = e.results[0][0].transcript.trim();
      if (!transcript) return;
      addUserMessage(transcript);
      getSocketSync()?.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        content: transcript,
        id: crypto.randomUUID(),
      });
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [addUserMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, speaking, startListening, stopListening, speak, cancelSpeech };
}
