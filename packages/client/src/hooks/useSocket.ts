import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "@jarvis/shared";
import type {
  AssistantChunkPayload,
  AssistantDonePayload,
  StateChangePayload,
  ToolUsePayload,
} from "@jarvis/shared";
import { getSocket } from "../lib/socket.js";
import { useAssistantStore } from "../store/assistantStore.js";

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { appendAssistantChunk, finalizeAssistant, setOrbState, setConnectionState } =
    useAssistantStore();

  useEffect(() => {
    let cancelled = false;

    getSocket().then((socket) => {
      if (cancelled) return;
      socketRef.current = socket;
      setConnectionState("connecting");

      socket.on("connect", () => setConnectionState("connected"));
      socket.on("disconnect", () => setConnectionState("disconnected"));

      socket.on(
        SOCKET_EVENTS.ASSISTANT_CHUNK,
        ({ text, taskId }: AssistantChunkPayload) => {
          appendAssistantChunk(taskId, text);
        },
      );

      socket.on(SOCKET_EVENTS.ASSISTANT_DONE, ({ taskId }: AssistantDonePayload) => {
        finalizeAssistant(taskId);
      });

      socket.on(SOCKET_EVENTS.STATE_CHANGE, ({ state }: StateChangePayload) => {
        setOrbState(state);
      });

      socket.on(SOCKET_EVENTS.TOOL_USE, (_payload: ToolUsePayload) => {
        // Tool use already reflected via STATE_CHANGE (thinking)
      });
    });

    return () => {
      cancelled = true;
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("disconnect");
        socketRef.current.off(SOCKET_EVENTS.ASSISTANT_CHUNK);
        socketRef.current.off(SOCKET_EVENTS.ASSISTANT_DONE);
        socketRef.current.off(SOCKET_EVENTS.STATE_CHANGE);
        socketRef.current.off(SOCKET_EVENTS.TOOL_USE);
      }
    };
  }, [appendAssistantChunk, finalizeAssistant, setConnectionState, setOrbState]);

  return socketRef;
}
