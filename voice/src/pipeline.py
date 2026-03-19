"""Pipecat pipeline: mic → VAD → wake word → STT → orchestrator → TTS → speaker.

STT: Deepgram if DEEPGRAM_API_KEY is set, otherwise raises a clear error
     (swap for faster-whisper or whisper.cpp for fully free offline STT).
TTS: Cartesia if CARTESIA_API_KEY is set, otherwise raises a clear error
     (swap for Kokoro or Piper for fully free offline TTS).
Wake: OpenWakeWord — free, local, no API key needed.
"""

import os

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.transports.local.audio import LocalAudioParams, LocalAudioTransport

from wake_word import WakeWordProcessor


def _build_stt():
    key = os.environ.get("DEEPGRAM_API_KEY")
    if key:
        from pipecat.services.deepgram import DeepgramSTTService
        return DeepgramSTTService(api_key=key)
    raise EnvironmentError(
        "DEEPGRAM_API_KEY is not set. "
        "For free offline STT, install faster-whisper and swap this out."
    )


def _build_tts():
    key = os.environ.get("CARTESIA_API_KEY")
    if key:
        voice_id = os.environ.get(
            "CARTESIA_VOICE_ID", "bf0a246a-8642-498a-9950-80c35e9276b5"
        )
        from pipecat.services.cartesia import CartesiaTTSService
        return CartesiaTTSService(api_key=key, voice_id=voice_id)
    raise EnvironmentError(
        "CARTESIA_API_KEY is not set. "
        "For free offline TTS, install kokoro-onnx or piper-tts and swap this out."
    )


async def build_pipeline() -> tuple[PipelineTask, PipelineRunner]:
    transport = LocalAudioTransport(
        LocalAudioParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            vad_enabled=True,
            vad_analyzer=SileroVADAnalyzer(),
            vad_audio_passthrough=True,
        )
    )

    stt = _build_stt()
    tts = _build_tts()
    wake_word = WakeWordProcessor()

    pipeline = Pipeline(
        [
            transport.input(),
            wake_word,
            stt,
            tts,
            transport.output(),
        ]
    )

    task = PipelineTask(pipeline)
    runner = PipelineRunner()
    return task, runner
