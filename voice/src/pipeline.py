"""Pipecat pipeline: microphone → VAD → Deepgram STT → orchestrator → Cartesia TTS → speaker."""

from pipecat.audio.vad.silero import SileroVADAnalyzer
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.services.cartesia import CartesiaTTSService
from pipecat.services.deepgram import DeepgramSTTService
from pipecat.transports.local.audio import LocalAudioTransport
from pipecat.transports.local.audio import LocalAudioParams

from config import CARTESIA_API_KEY, CARTESIA_VOICE_ID, DEEPGRAM_API_KEY
from wake_word import WakeWordProcessor


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

    stt = DeepgramSTTService(api_key=DEEPGRAM_API_KEY)

    tts = CartesiaTTSService(
        api_key=CARTESIA_API_KEY,
        voice_id=CARTESIA_VOICE_ID,
    )

    wake_word = WakeWordProcessor()

    pipeline = Pipeline(
        [
            transport.input(),
            wake_word,
            stt,
            # Text frames from STT go to the orchestrator transport
            # (imported and wired in main.py to avoid circular imports)
            tts,
            transport.output(),
        ]
    )

    task = PipelineTask(pipeline)
    runner = PipelineRunner()
    return task, runner
