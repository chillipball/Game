"""Jarvis voice pipeline entry point."""

import asyncio
import logging

from pipeline import build_pipeline

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jarvis.voice")


async def main() -> None:
    logger.info("Starting Jarvis voice pipeline…")
    task, runner = await build_pipeline()
    await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
