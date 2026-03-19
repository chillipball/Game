import type { Server as HTTPServer } from "http";
import { Server } from "socket.io";
import { jwtAuth } from "./auth/jwtMiddleware.js";
import { AgentManager } from "./agent/agentManager.js";
import { AssistantStateMachine } from "./state/assistantState.js";
import { SOCKET_EVENTS } from "@jarvis/shared";
import type { ChatMessagePayload, CancelTaskPayload } from "@jarvis/shared";

export function createSocketServer(httpServer: HTTPServer): {
  io: Server;
  agentManager: AgentManager;
} {
  const io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const stateMachine = new AssistantStateMachine(io);
  const agentManager = new AgentManager(io, stateMachine);

  io.use(jwtAuth);

  io.on("connection", (socket) => {
    // Send current state to newly connected client
    socket.emit(SOCKET_EVENTS.STATE_CHANGE, { state: stateMachine.current });

    socket.on(
      SOCKET_EVENTS.CHAT_MESSAGE,
      (payload: ChatMessagePayload) => {
        if (typeof payload?.content !== "string" || !payload.content.trim()) return;
        agentManager.send(payload.content.trim());
      },
    );

    socket.on(
      SOCKET_EVENTS.CANCEL_TASK,
      (_payload: CancelTaskPayload) => {
        // Abort is handled by re-creating the session; add per-task cancel if needed
        stateMachine.reset();
      },
    );

    socket.on("disconnect", () => {
      // Nothing to clean up per-socket; session is shared
    });
  });

  return { io, agentManager };
}
