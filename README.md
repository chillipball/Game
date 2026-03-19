# Jarvis AI Assistant

A voice-controlled AI assistant built on the Claude Agent SDK.

## Minimum cost setup (2 keys only)

```bash
cp .env.example .env
# Fill in ANTHROPIC_API_KEY + JWT_SECRET only
pnpm install
pnpm dev
```

Open `http://localhost:5173`. Use the 🎤 button — browser mic + speech synthesis are **free**.

## Cost breakdown

| Component | Default | Free alternative |
|-----------|---------|-----------------|
| AI brain | Claude Sonnet | Set `CLAUDE_MODEL=claude-haiku-4-5-20251001` (~20x cheaper) |
| STT (voice) | Deepgram (~$0.0059/min) | Browser Web Speech API (🎤 button) |
| TTS (voice) | Cartesia (paid/char) | Browser SpeechSynthesis (auto-reads replies) |
| Wake word | — | OpenWakeWord (local, free, no key) |

**With Haiku + browser voice: only cost is Claude tokens.**

## Requirements

- Node.js >= 20, pnpm >= 9
- Python >= 3.12 (voice pipeline only)

## Structure

```
packages/
  shared/   — Typed Socket.IO contracts
  server/   — Express + Socket.IO orchestrator (port 3001)
  client/   — React 19 + Vite frontend (port 5173)
voice/      — Python voice pipeline (optional)
```

## Voice pipeline (optional)

Only needed if you want hardware mic + speaker outside the browser.

```bash
cd voice
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt   # installs openwakeword (free)
# pip install pipecat-ai[deepgram] # only if DEEPGRAM_API_KEY is set
# pip install pipecat-ai[cartesia] # only if CARTESIA_API_KEY is set
python src/main.py
```

Wake word: say **"hey Jarvis"** — powered by OpenWakeWord (no API key).

## ElevenLabs animated orb (optional)

```bash
cd packages/client
npx shadcn@latest add https://ui.elevenlabs.io/r/orb.json
```
Then follow the TODO in `src/components/orb/OrbPanel.tsx`.
