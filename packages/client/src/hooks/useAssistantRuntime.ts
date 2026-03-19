import { useExternalStoreRuntime } from "@assistant-ui/react";
import type { ThreadMessageLike } from "@assistant-ui/react";
import { useAssistantStore } from "../store/assistantStore.js";
import { getSocketSync } from "../lib/socket.js";
import { SOCKET_EVENTS } from "@jarvis/shared";

export function useAssistantRuntime() {
  const messages = useAssistantStore((s) => s.messages);
  const addUserMessage = useAssistantStore((s) => s.addUserMessage);
  const isThinking = useAssistantStore((s) => s.orbState === "thinking");

  const threadMessages: ThreadMessageLike[] = messages.map((m) => ({
    role: m.role,
    id: m.id,
    content: [{ type: "text" as const, text: m.content }],
  }));

  return useExternalStoreRuntime<ThreadMessageLike>({
    messages: threadMessages,
    isRunning: isThinking,
    onNew: async (msg) => {
      const text =
        msg.content
          .filter((b): b is { type: "text"; text: string } => b.type === "text")
          .map((b) => b.text)
          .join("") ?? "";

      if (!text.trim()) return;
      addUserMessage(text);

      const socket = getSocketSync();
      socket?.emit(SOCKET_EVENTS.CHAT_MESSAGE, {
        content: text,
        id: crypto.randomUUID(),
      });
    },
  });
}
