"""WebSocket transport that relays text to/from the Jarvis orchestrator."""

import asyncio
import json
import urllib.request

import websockets
from pipecat.frames.frames import Frame, TextFrame, TransportMessageUrgentFrame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from config import ORCHESTRATOR_URL


def _fetch_token() -> str:
    req = urllib.request.Request(
        f"{ORCHESTRATOR_URL}/auth/token",
        method="POST",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
    return data["token"]


class OrchestratorTransport(FrameProcessor):
    """Sends LLM text output to the orchestrator via Socket.IO-compatible WebSocket."""

    def __init__(self) -> None:
        super().__init__()
        self._token = _fetch_token()
        self._ws_url = ORCHESTRATOR_URL.replace("http", "ws") + "/socket.io/?transport=websocket"
        self._send_queue: asyncio.Queue[str] = asyncio.Queue()
        self._task: asyncio.Task | None = None

    async def start(self, frame: Frame | None = None) -> None:
        self._task = asyncio.create_task(self._run())

    async def _run(self) -> None:
        async with websockets.connect(self._ws_url) as ws:
            # Socket.IO handshake: send auth
            await ws.send(json.dumps({"type": "auth", "token": self._token}))
            while True:
                text = await self._send_queue.get()
                payload = json.dumps(
                    ["chat:message", {"content": text, "id": "voice"}]
                )
                await ws.send(f"42{payload}")  # Socket.IO message prefix

    async def process_frame(
        self, frame: Frame, direction: FrameDirection
    ):
        if isinstance(frame, TextFrame):
            await self._send_queue.put(frame.text)
        yield frame
