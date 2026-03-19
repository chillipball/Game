import { AssistantRuntimeProvider, Thread } from "@assistant-ui/react";
import { useAssistantRuntime } from "../../hooks/useAssistantRuntime.js";
import { useVoice } from "../../hooks/useVoice.js";

export function ChatPanel() {
  const runtime = useAssistantRuntime();
  const { supported, listening, speaking, startListening, stopListening, cancelSpeech } =
    useVoice({ autoSpeak: true });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex flex-col h-full bg-jarvis-dark text-gray-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
          <span className="text-sm text-gray-400 tracking-wider uppercase">Jarvis</span>
          {supported && (
            <div className="flex items-center gap-2">
              {speaking && (
                <button
                  onClick={cancelSpeech}
                  className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded border border-gray-700"
                  title="Stop speaking"
                >
                  ■ stop
                </button>
              )}
              <button
                onClick={listening ? stopListening : startListening}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  listening
                    ? "bg-red-600 animate-pulse"
                    : "bg-gray-700 hover:bg-gray-600"
                }`}
                title={listening ? "Stop listening" : "Start voice input (free)"}
              >
                🎤
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <Thread />
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
}
