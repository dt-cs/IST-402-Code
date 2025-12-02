from __future__ import annotations

import os
import httpx
import json
from typing import Annotated, Any, List, Optional
from pydantic import BaseModel, ConfigDict, Field

# Supabase Client
from supabase import create_client, Client

# OpenAI Client
from openai import AsyncOpenAI

# ChatKit types
from chatkit.types import ProgressUpdateEvent
from chatkit.store import Store

# Agent framework
from agents import Agent, RunContextWrapper, function_tool
from chatkit.agents import AgentContext

# Local Import for RAG Logic
from utils.rag import index_meeting_transcript

# Import Request Context
from request_context import RequestContext

# Import Models & Sub-Agents
from utils.output_format import MeetingSummaryResponse
from custom_agents.summarizer_agent import summarizer_agent

from meeting_store import save_meeting_url

# -----------------------------------------------------------------------------
# 1. Configuration
# -----------------------------------------------------------------------------
YOUTUBE_API_URL = "https://youtubecc-423771082043.us-central1.run.app"
ZOOM_API_URL = "https://zoom-transcript-scraper-423771082043.us-central1.run.app"

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://sjgbaigjurwbszvphold.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "sb_publishable_OZW98EuSju2oK9rWNj9YSQ_BBz9b38w")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Initialize OpenAI
aclient = AsyncOpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# -----------------------------------------------------------------------------
# 2. Context Definition
# -----------------------------------------------------------------------------
class MeetingAgentContext(AgentContext):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    store: Annotated[Store, Field(exclude=True)] 
    request_context: Annotated[RequestContext, Field(exclude=True, default_factory=RequestContext)]

# -----------------------------------------------------------------------------
# 3. TOOLS (Server-Side Only)
# -----------------------------------------------------------------------------

@function_tool(description_override="Check if a meeting already exists in the database by URL.")
async def check_existing_meeting(ctx: RunContextWrapper[MeetingAgentContext], url: str) -> dict[str, Any]:
    """
    Tool to check if a meeting already exists in the database.
    If found, save the meeting URL to the current thread context.
    """
    print(f"[TOOL CALL] check_existing_meeting")
    await ctx.context.stream(ProgressUpdateEvent(text="Checking if meeting exists..."))

    if not supabase:
        raise HTTPException(status_code=500, detail="Database not initialized")

    # Query meetinglist for exact URL match
    result = (
        supabase.table("meetinglist")
        .select("*")
        .eq("zoom_url", url)
        .execute()
    )

    if result.data and len(result.data) > 0:
        # Meeting already exists
        meeting = result.data[0]

        # Save the URL in the agent's thread context
        save_meeting_url(ctx.context.thread.id, url)

        return {
            "found": True,
            "meeting_id": meeting["id"],
            "zoom_url": meeting["zoom_url"],
            "metadata": meeting.get("metadata"),
        }

    # Meeting not found
    return {"found": False}

@function_tool(description_override="Extract transcript from a YouTube or Zoom URL.")
async def extract_transcript_tool(
    ctx: RunContextWrapper[MeetingAgentContext],
    url: str,
) -> dict[str, Any]:
    print(f"[TOOL CALL] extract_transcript_tool: {url}")
    await ctx.context.stream(ProgressUpdateEvent(text=f"Extracting transcript..."))

    target_url = ""
    params = {}
    if "youtube.com" in url or "youtu.be" in url:
        target_url = YOUTUBE_API_URL
        params = {"url": url}
    elif "zoom.us" in url:
        target_url = ZOOM_API_URL
        params = {"url": url} 
    else:
        return {"error": "Unsupported URL type."}

    # --- SAVE THE URL FOR LATER ---
    save_meeting_url(ctx.context.thread.id, url)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(target_url, params=params, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            transcript_text = data.get("transcript", "")
            return {"transcript": transcript_text}
        except httpx.HTTPError as e:
            return {"error": f"Failed to fetch transcript: {str(e)}"}

@function_tool(description_override="Save meeting summary to Supabase.")
async def save_meeting_tool(
    ctx: RunContextWrapper[MeetingAgentContext],
    url: str,
    transcript: str,
    summary: MeetingSummaryResponse,
) -> str:
    print(f"[TOOL CALL] save_meeting_tool")
    await ctx.context.stream(ProgressUpdateEvent(text="Generating summary embedding..."))
    
    if not supabase:
        return "Error: Supabase not configured."

    # 1. Generate Embedding
    summary_text_to_embed = summary.model_dump_json()
    embedding_vector = None
    try:
        response = await aclient.embeddings.create(
            input=summary_text_to_embed,
            model="text-embedding-3-small"
        )
        embedding_vector = response.data[0].embedding
    except Exception as e:
        print(f"Embedding generation failed: {e}")

    # 2. Save Data
    await ctx.context.stream(ProgressUpdateEvent(text="Saving to database..."))
    data = {
        "zoom_url": url ,
        "content": transcript,
        "metadata": summary.model_dump(),
        "embedding": embedding_vector 
    }
    
    try:
        supabase.table("meetinglist").upsert(data, on_conflict="zoom_url").execute()
        return "Successfully saved meeting with search index."
    except Exception as e:
        return f"Database Error: {str(e)}"

@function_tool(description_override="Process transcript into vector chunks for RAG search.")
async def process_rag_tool(
    ctx: RunContextWrapper[MeetingAgentContext],
    url: str,
    transcript: str,
) -> str:
    print(f"[TOOL CALL] process_rag_tool")
    await ctx.context.stream(ProgressUpdateEvent(text="Generating knowledge base..."))

    if not supabase:
        return "Error: Supabase not configured."

    try:
        # Retry logic just in case
        meeting_id = None
        for attempt in range(5):
            response = (
                supabase.table("meetinglist")
                .select("id")
                .eq("zoom_url", url)
                .execute()
            )
            rows = response.data or []
            if rows:
                meeting_id = rows[0]["id"]
                break
            await asyncio.sleep(0.2)

        if meeting_id is None:
            return "Error: Meeting not found after retries."

        result_message = await index_meeting_transcript(meeting_id, transcript, supabase)
        return result_message

    except Exception as e:
        return f"RAG Processing Failed: {str(e)}"

# -----------------------------------------------------------------------------
# 4. MAIN AGENT: The Orchestrator
# -----------------------------------------------------------------------------
transcript_maker_agent = Agent[MeetingAgentContext](
    model="gpt-4o-mini",
    name="Orchestrator",
    instructions="""
    You are the Meeting Orchestrator.

    # STEP 0 — INPUT ANALYSIS
    1. Look for a valid meeting URL (Zoom, YouTube).
    2. IF NO valid URL is found: Simply ask for one.
    3. IF a URL IS found: Check if the meeting already exists in the database. call `check_existing_meeting(url)` and return wihtout further processing.
    4. IF THE MEETING DOES NOT EXIST: Proceed WITH THE WORKFLOW BELOW.

    # STRICT WORKFLOW
    You MUST execute ALL the following steps IN ORDER:

    1. **Extraction**: Call `extract_transcript_tool(url)`. pass the user provided URL to get the raw transcript.
    
    2. **Analysis**: Call `summarize_transcript_tool` to analyze the extracted transcript.

    3. **Persistence**: Call `save_meeting_tool`. This saves the data to the database.

    4. **Indexing**: Call `process_rag_tool` to index for search.

    5. **Final Response**:
       Respond with a short confirmation:
       "Your meeting has been processed, summarized, saved, and indexed successfully."
    """,
    tools=[
        check_existing_meeting,
        extract_transcript_tool,
        save_meeting_tool,
        process_rag_tool,
        summarizer_agent.as_tool(
            tool_name="summarize_transcript_tool",
            tool_description="Takes a raw transcript and returns a perfect JSON summary matching the schema."
        )
    ],
    # No StopAtTools needed anymore. The agent runs straight through!
)