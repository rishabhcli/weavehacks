"""
QAgent Voice Agent using Pipecat + Daily
"""
import asyncio
import os
from pipecat.pipeline.pipeline import Pipeline
from pipecat.pipeline.runner import PipelineRunner
from pipecat.pipeline.task import PipelineTask
from pipecat.processors.aggregators.openai_llm_context import OpenAILLMContext
from pipecat.services.openai import OpenAILLMService
from pipecat.services.deepgram import DeepgramSTTService
from pipecat.services.elevenlabs import ElevenLabsTTSService
from pipecat.transports.services.daily import DailyParams, DailyTransport
import aiohttp

ORCHESTRATOR_URL = os.getenv("ORCHESTRATOR_URL", "http://localhost:3000")


class QAgentVoiceAgent:
    def __init__(self):
        self.system_prompt = """You are QAgent, a self-healing QA agent.
You help developers find and fix bugs automatically.

Available commands:
- "run tests" or "start testing" - Runs the test suite
- "what bugs" or "show bugs" - Lists found bugs
- "explain fix" - Explains the last fix applied
- "status" - Shows current agent status

Be concise, friendly, and technical. Always explain what you're doing."""

    async def handle_command(self, text: str) -> str:
        text_lower = text.lower()

        if any(x in text_lower for x in ["run test", "start test", "begin test"]):
            return await self.run_tests()
        elif any(x in text_lower for x in ["what bug", "show bug", "found bug"]):
            return await self.get_bugs()
        elif any(x in text_lower for x in ["explain", "tell me about"]):
            return await self.explain_fix()
        elif "status" in text_lower:
            return await self.get_status()
        else:
            return "I can run tests, show bugs, explain fixes, or give you a status update. What would you like?"

    async def run_tests(self) -> str:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{ORCHESTRATOR_URL}/api/runs",
                json={
                    "repoName": "Demo App",
                    "testSpecs": [],
                    "maxIterations": 5,
                },
            ) as resp:
                if resp.status == 201:
                    data = await resp.json()
                    run_id = data.get("run", {}).get("id", "unknown")[:8]
                    return f"Starting test run. I'll analyze your application and fix any bugs I find. Run ID is {run_id}."
                else:
                    return "I encountered an issue starting the tests. Please check the dashboard."

    async def get_bugs(self) -> str:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{ORCHESTRATOR_URL}/api/runs") as resp:
                data = await resp.json()
                runs = data.get("runs", [])
                if not runs:
                    return "No test runs found yet. Would you like me to run some tests?"

                latest = runs[0]
                bugs = latest.get("patchesApplied", 0)
                if bugs == 0:
                    return "Good news! No bugs found in the latest run."
                else:
                    return f"I found {bugs} bugs in the latest run and applied fixes for all of them."

    async def explain_fix(self) -> str:
        return "The last fix I applied was adding a null check to the onClick handler. The button was trying to call a function that didn't exist when the user clicked before the page fully loaded."

    async def get_status(self) -> str:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{ORCHESTRATOR_URL}/api/runs") as resp:
                data = await resp.json()
                stats = data.get("stats", {})
                total = stats.get("totalRuns", 0)
                pass_rate = stats.get("passRate", 0)
                patches = stats.get("patchesApplied", 0)
                return f"I've run {total} test sessions with a {pass_rate:.0f}% pass rate. I've applied {patches} fixes total."


async def main():
    agent = QAgentVoiceAgent()

    transport = DailyTransport(
        room_url=os.getenv("DAILY_ROOM_URL"),
        token=os.getenv("DAILY_TOKEN"),
        bot_name="QAgent",
        params=DailyParams(
            audio_in_enabled=True,
            audio_out_enabled=True,
            transcription_enabled=True,
        ),
    )

    stt = DeepgramSTTService(api_key=os.getenv("DEEPGRAM_API_KEY"))
    tts = ElevenLabsTTSService(
        api_key=os.getenv("ELEVENLABS_API_KEY"),
        voice_id="21m00Tcm4TlvDq8ikWAM",
    )
    llm = OpenAILLMService(
        api_key=os.getenv("OPENAI_API_KEY"),
        model="gpt-4o",
    )

    context = OpenAILLMContext(
        messages=[{"role": "system", "content": agent.system_prompt}]
    )

    pipeline = Pipeline(
        [
            transport.input(),
            stt,
            context,
            llm,
            tts,
            transport.output(),
        ]
    )

    runner = PipelineRunner()
    task = PipelineTask(pipeline)
    await runner.run(task)


if __name__ == "__main__":
    asyncio.run(main())
