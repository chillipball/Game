"""OpenWakeWord processor for Pipecat — free, runs fully locally.

Install: pip install openwakeword
Model downloads automatically on first run (~10 MB).
Default keyword: "hey_jarvis"
"""

import struct
from collections.abc import AsyncGenerator
from collections.abc import Callable

import numpy as np
from openwakeword.model import Model
from pipecat.frames.frames import AudioRawFrame, Frame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

_SAMPLE_RATE = 16_000
_FRAME_MS = 80  # openwakeword expects 80 ms chunks at 16 kHz
_CHUNK_SAMPLES = _SAMPLE_RATE * _FRAME_MS // 1000  # 1280 samples


class WakeWordProcessor(FrameProcessor):
    """Gates audio frames until the wake word is detected."""

    def __init__(self, on_wake: "Callable[[], None] | None" = None) -> None:
        super().__init__()
        # Downloads model weights automatically on first run
        self._model = Model(wakeword_models=["hey_jarvis"], inference_framework="onnx")
        self._on_wake = on_wake
        self._active = False
        self._buf: list[int] = []

    async def process_frame(
        self, frame: Frame, direction: FrameDirection
    ) -> AsyncGenerator[Frame, None]:
        if not isinstance(frame, AudioRawFrame):
            yield frame
            return

        # Accumulate 16-bit PCM samples
        samples = struct.unpack_from(f"{len(frame.audio) // 2}h", frame.audio)
        self._buf.extend(samples)

        while len(self._buf) >= _CHUNK_SAMPLES:
            chunk = np.array(self._buf[:_CHUNK_SAMPLES], dtype=np.int16)
            del self._buf[:_CHUNK_SAMPLES]
            prediction = self._model.predict(chunk)
            score = max(prediction.get("hey_jarvis", [0]))
            if score > 0.5:
                self._active = True
                if self._on_wake:
                    self._on_wake()

        if self._active:
            yield frame
