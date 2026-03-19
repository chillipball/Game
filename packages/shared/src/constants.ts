/** Socket.IO event names — single source of truth for client and server */
export const SOCKET_EVENTS = {
  // Client → Server
  CHAT_MESSAGE: "chat:message",
  VOICE_AUDIO: "voice:audio",
  CANCEL_TASK: "task:cancel",

  // Server → Client
  ASSISTANT_CHUNK: "assistant:chunk",
  ASSISTANT_DONE: "assistant:done",
  TOOL_USE: "tool:use",
  STATE_CHANGE: "state:change",
  SYSTEM_EVENT: "system:event",
  ERROR: "error",
} as const;

export const SERVER_PORT = 3001;
export const JWT_EXPIRY = "24h";
