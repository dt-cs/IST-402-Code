from typing import List, Optional
from pydantic import BaseModel, Field

# --- Pydantic Models for Structured Output ---
class Metadata(BaseModel):
    meeting_title: Optional[str] = None
    date: Optional[str] = None
    project: Optional[str] = None

class ActionItem(BaseModel):
    task: Optional[str] = None
    owner: Optional[str] = None
    due: Optional[str] = None  # optional date

class Insights(BaseModel):
    topics: Optional[List[str]] = None
    priority: Optional[str] = None
    decisions: Optional[List[str]] = None
    notes: Optional[str] = None # extra flexibility

class MeetingSummaryResponse(BaseModel):
    metadata: Metadata
    attendees: List[str]
    summary: str
    action_items: List[ActionItem]
    insights: Insights
    url: str = Field(..., description="The original meeting URL provided.")