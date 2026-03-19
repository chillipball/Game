import { AgentSession } from "./agentSession.js";
import type { Server } from "socket.io";
import { StreamBridge } from "./streamBridge.js";
import type { AssistantStateMachine } from "../state/assistantState.js";

/** Singleton that owns one long-lived AgentSession for the lifetime of the process. */
export class AgentManager {
  private session: AgentSession | null = null;

  constructor(
    private io: Server,
    private stateMachine: AssistantStateMachine,
  ) {}

  async init(): Promise<void> {
    const session = new AgentSession();
    const bridge = new StreamBridge(this.io, this.stateMachine);

    session.on("message", (msg) => bridge.handle(msg));
    session.on("error", (err) => {
      console.error("[agent] error:", err);
      this.stateMachine.reset();
    });

    this.session = session;
    // start() runs indefinitely — don't await
    session.start().catch((err) => console.error("[agent] fatal:", err));
  }

  send(text: string): void {
    if (!this.session) throw new Error("AgentManager not initialised");
    this.stateMachine.transition("thinking");
    this.session.send(text);
  }

  destroy(): void {
    this.session?.destroy();
    this.session = null;
  }
}
