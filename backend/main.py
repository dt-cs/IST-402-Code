import os
import uvicorn
from fastapi import Depends, FastAPI, Request, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from starlette.responses import JSONResponse
from dotenv import load_dotenv

from chatkit.server import StreamingResult
from supabase import create_client, Client

# Local Imports
from supabase_store import SupabaseStore 
from server import MyChatKitServer
from request_context import RequestContext

from meeting_store import get_meeting_url


load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://sjgbaigjurwbszvphold.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "sb_publishable_OZW98EuSju2oK9rWNj9YSQ_BBz9b38w")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("⚠️ WARNING: Supabase Keys missing.")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- Setup Server ---
store = SupabaseStore(supabase_client=supabase)
simple_server = MyChatKitServer(data_store=store)

app = FastAPI(title="ChatKit Meeting Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_server() -> MyChatKitServer:
    return simple_server

# --- Endpoints ---

@app.post("/chatkit")
async def chatkit_endpoint(
    request: Request, server: MyChatKitServer = Depends(get_server)
) -> Response:
    payload = await request.body()
    context = {"request": request} 
    result = await server.process(payload, context)

    if isinstance(result, StreamingResult):
        return StreamingResponse(result, media_type="text/event-stream")
    
    if hasattr(result, "json"):
        return Response(content=result.json, media_type="application/json")
        
    return JSONResponse(result)


# --- UPDATED: Data Fetching by URL ---
@app.get("/api/analysis")
async def get_meeting_analysis(url: str = Query(..., description="The YouTube or Zoom URL")):
    """
    Fetch meeting + transcript chunks by URL.
    Usage: GET /api/analysis?url=https://youtube.com/...
    """
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not initialized")

    # 1. Get the main meeting record by URL
    meeting_result = (
        supabase.table("meetinglist")
        .select("*")
        .eq("zoom_url", url)
        .execute() # .single() might crash if not found, so we check list
    )
    
    if not meeting_result.data or len(meeting_result.data) == 0:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    meeting = meeting_result.data[0]
    meeting_id = meeting["id"]

    # 2. Fetch chunks
    chunks_result = (
        supabase.table("transcript_chunks")
        .select("content")
        .eq("transcript_id", meeting_id) 
        .order("chunk_index", desc=False)
        .execute()
    )

    chunks = chunks_result.data or []

    # 3. Join chunks (or fallback to the 'content' column)
    if chunks:
        # Join with double newline for readability
        raw_transcript = "\n\n".join([c["content"] for c in chunks])
    else:
        raw_transcript = meeting.get("content", "")

    return {
        "metadata": meeting.get("metadata", {}),
        "transcript": raw_transcript,
    }

@app.get("/api/meeting/{thread_id}/url")
async def meeting_url(thread_id: str):
    url = get_meeting_url(thread_id)
    if not url:
        return {"error": "No meeting URL found"}
    return {"url": url}


if __name__ == "__main__":
    print("🚀 Meeting Agent Backend running on http://localhost:8000")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)