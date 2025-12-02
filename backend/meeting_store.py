# meeting_store.py
from typing import Dict

# Simple in-memory store (replace with Supabase/DB for persistence)
_meeting_urls: Dict[str, str] = {}

def save_meeting_url(thread_id: str, url: str) -> None:
    """Save the meeting URL for a given thread."""
    _meeting_urls[thread_id] = url

def get_meeting_url(thread_id: str) -> str | None:
    """Fetch the meeting URL for a thread."""
    return _meeting_urls.get(thread_id)