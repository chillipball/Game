"""Settings loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()


def _require(key: str) -> str:
    val = os.environ.get(key)
    if not val:
        raise EnvironmentError(f"Required env var {key!r} is not set")
    return val


DEEPGRAM_API_KEY: str = _require("DEEPGRAM_API_KEY")
CARTESIA_API_KEY: str = _require("CARTESIA_API_KEY")
PICOVOICE_ACCESS_KEY: str = _require("PICOVOICE_ACCESS_KEY")

ORCHESTRATOR_URL: str = os.environ.get("ORCHESTRATOR_URL", "http://localhost:3001")
SERVER_PORT: int = int(os.environ.get("SERVER_PORT", "3001"))

# Cartesia British voice — use any Cartesia voice ID you prefer
CARTESIA_VOICE_ID: str = os.environ.get(
    "CARTESIA_VOICE_ID", "bf0a246a-8642-498a-9950-80c35e9276b5"
)
