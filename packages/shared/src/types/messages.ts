import type { OrbState } from "./state.js";

// ── Client → Server ──────────────────────────────────────────────────────────

export interface ChatMessagePayload {
  content: string;
  id: string;
}

export interface VoiceAudioPayload {
  audio: ArrayBuffer;
  format: "opus" | "pcm16";
}

export interface CancelTaskPayload {
  taskId: string;
}

// ── Server → Client ──────────────────────────────────────────────────────────

export interface AssistantChunkPayload {
  text: string;
  taskId: string;
}

export interface AssistantDonePayload {
  taskId: string;
  result: string;
}

export interface ToolUsePayload {
  taskId: string;
  name: string;
}

export interface StateChangePayload {
  state: OrbState;
}

export interface SystemEventPayload {
  subtype: string;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}
