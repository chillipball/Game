import { Suspense, useEffect } from "react";
import { useAssistantStore } from "../../store/assistantStore.js";
import { useOrbAudio } from "../../hooks/useOrbAudio.js";

/**
 * Placeholder orb rendered until the ElevenLabs WebGL orb is installed.
 * After running: npx shadcn@latest add https://ui.elevenlabs.io/r/orb.json
 * Replace this with: import { Orb } from "./Orb.js";
 */
function OrbFallback({ state }: { state: string }) {
  const scale = state === "idle" ? 1 : state === "listening" ? 1.1 : state === "thinking" ? 1.05 : 1.15;
  const color =
    state === "idle" ? "#4a5568" :
    state === "listening" ? "#3182ce" :
    state === "thinking" ? "#805ad5" :
    "#38a169";

  return (
    <div className="flex items-center justify-center w-full h-full">
      <div
        className="rounded-full transition-all duration-500"
        style={{
          width: 200,
          height: 200,
          background: `radial-gradient(circle at 40% 40%, ${color}cc, ${color}44)`,
          boxShadow: `0 0 60px ${color}88`,
          transform: `scale(${scale})`,
        }}
      />
    </div>
  );
}

export function OrbPanel() {
  const orbState = useAssistantStore((s) => s.orbState);
  const { getInputVolume, getOutputVolume, connectMicrophone } = useOrbAudio();

  // Auto-connect microphone on mount (user gesture required by browser)
  useEffect(() => {
    connectMicrophone().catch(() => {
      // Mic permission denied — orb still works without input volume
    });
  }, [connectMicrophone]);

  return (
    <div className="flex items-center justify-center h-full bg-jarvis-panel">
      <Suspense fallback={<OrbFallback state={orbState} />}>
        {/*
          TODO: After running `npx shadcn@latest add https://ui.elevenlabs.io/r/orb.json`
          replace OrbFallback with:
          <Orb
            agentState={orbState}
            getInputVolume={getInputVolume}
            getOutputVolume={getOutputVolume}
          />
        */}
        <OrbFallback state={orbState} />
      </Suspense>
      <div className="absolute bottom-6 text-xs text-gray-500 tracking-widest uppercase">
        {orbState}
      </div>
    </div>
  );
}
