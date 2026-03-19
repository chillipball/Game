import { AssistantRuntimeProvider, Thread } from "@assistant-ui/react";
import { useAssistantRuntime } from "../../hooks/useAssistantRuntime.js";

export function ChatPanel() {
  const runtime = useAssistantRuntime();

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full bg-jarvis-dark text-gray-100">
        <div className="px-4 py-3 border-b border-gray-800 text-sm text-gray-400 tracking-wider uppercase">
          Jarvis
        </div>
        <div className="flex-1 overflow-hidden">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
