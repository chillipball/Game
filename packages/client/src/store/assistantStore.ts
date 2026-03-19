import { create } from "zustand";
import type { OrbState } from "@jarvis/shared";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** true while the assistant is still streaming this message */
  isStreaming?: boolean;
}

interface AssistantStore {
  messages: Message[];
  orbState: OrbState;
  connectionState: "disconnected" | "connecting" | "connected";

  addUserMessage: (content: string) => string;
  appendAssistantChunk: (taskId: string, text: string) => void;
  finalizeAssistant: (taskId: string) => void;
  setOrbState: (state: OrbState) => void;
  setConnectionState: (state: "disconnected" | "connecting" | "connected") => void;
}

export const useAssistantStore = create<AssistantStore>((set) => ({
  messages: [],
  orbState: "idle",
  connectionState: "disconnected",

  addUserMessage: (content) => {
    const id = crypto.randomUUID();
    set((s) => ({ messages: [...s.messages, { id, role: "user", content }] }));
    return id;
  },

  appendAssistantChunk: (taskId, text) => {
    set((s) => {
      const last = s.messages[s.messages.length - 1];
      if (last?.id === taskId && last.role === "assistant") {
        // Append to existing streaming message
        return {
          messages: [
            ...s.messages.slice(0, -1),
            { ...last, content: last.content + text },
          ],
        };
      }
      // Start a new assistant message
      return {
        messages: [
          ...s.messages,
          { id: taskId, role: "assistant", content: text, isStreaming: true },
        ],
      };
    });
  },

  finalizeAssistant: (taskId) => {
    set((s) => ({
      messages: s.messages.map((m) =>
        m.id === taskId ? { ...m, isStreaming: false } : m,
      ),
    }));
  },

  setOrbState: (state) => set({ orbState: state }),
  setConnectionState: (connectionState) => set({ connectionState }),
}));
