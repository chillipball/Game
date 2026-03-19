import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import type { Server } from "socket.io";
import { SOCKET_EVENTS } from "@jarvis/shared";
import type { AssistantStateMachine } from "../state/assistantState.js";
import { auditLog } from "../audit/auditLogger.js";

/** Translates raw Claude Agent SDK messages into typed Socket.IO events. */
export class StreamBridge {
  constructor(
    private io: Server,
    private state: AssistantStateMachine,
  ) {}

  handle(msg: SDKMessage): void {
    switch (msg.type) {
      case "assistant": {
        for (const block of msg.message.content) {
          if (block.type === "text") {
            this.state.transition("talking");
            this.io.emit(SOCKET_EVENTS.ASSISTANT_CHUNK, {
              text: block.text,
              taskId: msg.message.id,
            });
          } else if (block.type === "tool_use") {
            this.state.transition("thinking");
            auditLog({ type: "tool_use", data: { name: block.name, id: block.id } });
            this.io.emit(SOCKET_EVENTS.TOOL_USE, {
              name: block.name,
              taskId: msg.message.id,
            });
          }
        }
        break;
      }
      case "result": {
        this.state.reset();
        this.io.emit(SOCKET_EVENTS.ASSISTANT_DONE, {
          taskId: "",
          result: msg.subtype === "success" ? (msg.result ?? "") : msg.error,
        });
        break;
      }
      case "system": {
        this.io.emit(SOCKET_EVENTS.SYSTEM_EVENT, { subtype: msg.subtype });
        break;
      }
    }
  }
}
