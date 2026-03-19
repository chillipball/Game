"""Picovoice Porcupine wake-word processor for Pipecat."""

import struct
from typing import AsyncGenerator

import pvporcupine
from pipecat.frames.frames import AudioRawFrame, Frame
from pipecat.processors.frame_processor import FrameDirection, FrameProcessor

from config import PICOVOICE_ACCESS_KEY


class WakeWordProcessor(FrameProcessor):
    """Listens for the 'jarvis' wake word and gates audio downstream."""

    def __init__(self, on_wake: "Callable[[], None] | None" = None):
        super().__init__()
        self._porcupine = pvporcupine.create(
            access_key=PICOVOICE_ACCESS_KEY,
            keywords=["jarvis"],
        )
        self._on_wake = on_wake
        self._active = False
        self._buf: list[int] = []

    async def process_frame(
        self, frame: Frame, direction: FrameDirection
    ) -> AsyncGenerator[Frame, None]:
        if not isinstance(frame, AudioRawFrame):
            yield frame
            return

        # Accumulate PCM samples (16-bit LE)
        samples = struct.unpack_from(
            f"{len(frame.audio) // 2}h", frame.audio
        )
        self._buf.extend(samples)

        # Process in Porcupine-sized chunks
        chunk = self._porcupine.frame_length
        while len(self._buf) >= chunk:
            pcm = self._buf[:chunk]
            del self._buf[:chunk]
            result = self._porcupine.process(pcm)
            if result >= 0:
                self._active = True
                if self._on_wake:
                    self._on_wake()

        if self._active:
            yield frame

    def __del__(self) -> None:
        self._porcupine.delete()
