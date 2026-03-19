import { OrbPanel } from "../orb/OrbPanel.js";
import { ChatPanel } from "../chat/ChatPanel.js";
import { useAssistantStore } from "../../store/assistantStore.js";

export function Layout() {
  const connectionState = useAssistantStore((s) => s.connectionState);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-jarvis-dark">
      {/* Status bar */}
      {connectionState !== "connected" && (
        <div className="fixed top-0 inset-x-0 z-50 py-1 px-4 text-xs text-center bg-yellow-900/80 text-yellow-200">
          {connectionState === "disconnected" ? "Disconnected — reconnecting…" : "Connecting…"}
        </div>
      )}

      {/* Orb panel — fixed width on desktop, full screen on mobile */}
      <div className="hidden md:flex md:w-80 lg:w-96 flex-shrink-0 relative border-r border-gray-800">
        <OrbPanel />
      </div>

      {/* Chat panel — fills remaining space */}
      <div className="flex-1 min-w-0">
        <ChatPanel />
      </div>

      {/* Mobile: floating orb above chat */}
      <div className="md:hidden fixed bottom-20 right-4 w-20 h-20 rounded-full overflow-hidden z-40 shadow-lg border border-gray-700">
        <OrbPanel />
      </div>
    </div>
  );
}
