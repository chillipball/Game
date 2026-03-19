# Jarvis AI Assistant

A voice-controlled AI assistant built on Claude Code with MCP servers, voice pipeline, and React frontend.

## Quick Start

```bash
cp .env.example .env
# Fill in your API keys in .env
pnpm install
pnpm dev
```

## Requirements

- Node.js >= 20, pnpm >= 9
- Python >= 3.12 (for voice pipeline)
- Windows recommended for full desktop control via PyAutoGUI

## Structure

```
packages/
  shared/   — Shared TypeScript types and constants
  server/   — Express + Socket.IO orchestrator (port 3001)
  client/   — React 19 + Vite frontend
voice/      — Python voice pipeline (Pipecat)
```

## Running

```bash
# All packages in parallel (dev mode)
pnpm dev

# Server only
pnpm start:server

# Voice pipeline
cd voice && python src/main.py
```

## API Keys Needed

- `ANTHROPIC_API_KEY` — Claude API
- `DEEPGRAM_API_KEY` — Speech-to-text
- `CARTESIA_API_KEY` — Text-to-speech
- `PICOVOICE_ACCESS_KEY` — Wake word ("Jarvis")
