import { EventEmitter } from "events";
import { query, type SDKMessage } from "@anthropic-ai/claude-agent-sdk";
import { auditLog } from "../audit/auditLogger.js";

type UserTurn = { role: "user"; content: string };

export class AgentSession extends EventEmitter {
  private queue: UserTurn[] = [];
  private resolvers: Array<() => void> = [];
  private abortController = new AbortController();
  private running = false;

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    const self = this;

    async function* inputStream(): AsyncGenerator<UserTurn> {
      while (!self.abortController.signal.aborted) {
        if (self.queue.length === 0) {
          await new Promise<void>((resolve) => self.resolvers.push(resolve));
        }
        const turn = self.queue.shift();
        if (turn) yield turn;
      }
    }

    try {
      for await (const msg of query({
        prompt: inputStream(),
        options: {
          cwd: process.cwd(),
          permissionMode: "acceptEdits",
          disallowedTools: [
            "Bash(rm -rf*)",
            "Bash(sudo *)",
            "Bash(curl *)",
            "Bash(wget *)",
          ],
        },
      })) {
        this.emit("message", msg as SDKMessage);
      }
    } catch (err) {
      if (!this.abortController.signal.aborted) {
        this.emit("error", err);
      }
    } finally {
      this.running = false;
    }
  }

  send(text: string): void {
    auditLog({ type: "message", data: { direction: "user", length: text.length } });
    this.queue.push({ role: "user", content: text });
    this.resolvers.shift()?.();
  }

  destroy(): void {
    this.abortController.abort();
    // Unblock any pending await so the generator can exit
    for (const resolve of this.resolvers) resolve();
    this.resolvers = [];
  }
}
