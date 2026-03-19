import type { OrbState } from "@jarvis/shared";
import type { Server } from "socket.io";
import { SOCKET_EVENTS } from "@jarvis/shared";

const TRANSITIONS: Record<OrbState, OrbState[]> = {
  idle: ["listening", "thinking"],
  listening: ["thinking", "idle"],
  thinking: ["talking", "idle"],
  talking: ["idle"],
};

export class AssistantStateMachine {
  private state: OrbState = "idle";

  constructor(private io: Server) {}

  get current(): OrbState {
    return this.state;
  }

  transition(next: OrbState): boolean {
    if (!TRANSITIONS[this.state].includes(next)) return false;
    this.state = next;
    this.io.emit(SOCKET_EVENTS.STATE_CHANGE, { state: this.state });
    return true;
  }

  reset(): void {
    this.state = "idle";
    this.io.emit(SOCKET_EVENTS.STATE_CHANGE, { state: this.state });
  }
}
