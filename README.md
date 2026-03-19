# Jarvis AI Assistant

A voice-controlled AI assistant built on the Claude Agent SDK.

## Setup (Claude.ai subscription — no API key needed)

```bash
# 1. Authenticate once with your Claude.ai Pro/Max plan
claude auth login
# Opens a browser → sign in → done. Credentials stored locally.

# 2. Configure the server
cp .env.example .env
# Only JWT_SECRET is required — fill it in:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Install and run
pnpm install
pnpm dev
```

Open `http://localhost:5173`. The 🎤 button uses browser mic/speech synthesis — completely free.

> **If you prefer per-token billing** instead of your subscription, set `ANTHROPIC_API_KEY` in `.env`.

---

## Cost breakdown

| Component | Cost |
|-----------|------|
| AI brain | Covered by your Claude.ai Pro/Max plan |
| STT (voice) | Free — browser Web Speech API |
| TTS (voice) | Free — browser SpeechSynthesis |
| Wake word | Free — OpenWakeWord (local) |

**Only ongoing cost: your existing Claude.ai subscription.**

---

## Requirements

- Node.js >= 20, pnpm >= 9
- Claude Code CLI (`claude`) authenticated via `claude auth login`
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

Only needed if you want a dedicated hardware mic/speaker outside the browser.

```bash
cd voice
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# Set DEEPGRAM_API_KEY / CARTESIA_API_KEY in .env for cloud STT/TTS
# or swap in a local model — see voice/src/pipeline.py comments
python src/main.py
```

Wake word: say **"hey Jarvis"** — powered by OpenWakeWord (no API key).

## ElevenLabs animated orb (optional)

```bash
cd packages/client
npx shadcn@latest add https://ui.elevenlabs.io/r/orb.json
```
Then follow the TODO in `src/components/orb/OrbPanel.tsx`.
