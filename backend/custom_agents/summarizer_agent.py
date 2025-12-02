from __future__ import annotations

from typing import Annotated

from agents import Agent
from chatkit.agents import AgentContext
from pydantic import ConfigDict, Field

from utils.output_format import (
    ActionItem,
    Insights,
    Metadata,
    MeetingSummaryResponse,
)

from supabase_store import SupabaseStore
from memory_store import MemoryStore

INSTRUCTIONS = """
    You are an AI specialist focused on data extraction.
    Your ONLY job is to take a raw transcript and convert it into the structured format required.
    
    Ensure all fields in the schema are populated based on the transcript text.
    If information is missing for a specific field, use null or appropriate empty values.
"""

MODEL = "gpt-4o-mini"

class SummarizerAgentContext(AgentContext):
    model_config = ConfigDict(arbitrary_types_allowed=True)
    store: Annotated[SupabaseStore, Field(exclude=True)]
    request_context: Annotated[MemoryStore, Field(exclude=True, default_factory=RequestContext)]

summarizer_agent = Agent[SummarizerAgentContext](
    model=MODEL,
    name="summarizer_agent",
    instructions=INSTRUCTIONS,
    output_type=MeetingSummaryResponse,
)
