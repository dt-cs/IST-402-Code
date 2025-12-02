# Backend Architecture

The backend is responsible for **meeting transcript extraction**, **AI summarization**, **data persistence**, and **vector indexing**. It is built using **Python**, **FastAPI**, and integrates with **OpenAI** and **Supabase**.

---

## 1. Agents & Orchestration

### a) **Orchestrator Agent**
- Entry point for processing a meeting.
- Workflow:
  1. Extract transcript (`extract_transcript_tool`)
  2. Summarize transcript (`summarizer_agent`)
  3. Save meeting data (`save_meeting_tool`)
  4. Index transcript for RAG search (`process_rag_tool`)
- Ensures **strict sequential execution**.

### b) **Summarizer Agent**
- Converts raw transcript into structured JSON.
- Output matches the `MeetingSummaryResponse` schema:
  - `metadata` (title, date, project)
  - `attendees`
  - `summary` (text)
  - `action_items`
  - `insights` (topics, priority, decisions, notes)
  - `url`

---

## 2. Tools & Functions

### a) Transcript Extraction
- Supports **YouTube** and **Zoom** URLs.
- Fetches transcript via external APIs:
  - `YOUTUBE_API_URL`
  - `ZOOM_API_URL`
- Returns raw transcript text.

### b) Save Meeting Tool
- Persists:
  - Raw transcript
  - Summarized metadata
  - Embedding vector for semantic search
- Uses **Supabase** with `upsert` to prevent duplicates.

### c) RAG Indexing
- Splits transcript into chunks (`RecursiveCharacterTextSplitter`)
- Generates embeddings (`text-embedding-3-small`)
- Stores vector chunks in Supabase (`transcript_chunks`)
- Deletes old chunks to prevent duplicates.

---

## 3. Data Models

### `MeetingSummaryResponse`
- `metadata`: meeting title, date, project
- `attendees`: list of attendees
- `summary`: executive summary text
- `action_items`: list of tasks with owner & due date
- `insights`: topics, priority, decisions, notes
- `url`: original meeting URL

---

## 4. Backend Flow Summary

1. Receive meeting URL from frontend.
2. Orchestrator agent executes tools sequentially:
   - Extract transcript
   - Summarize & structure
   - Persist in Supabase
   - Generate embeddings & index for RAG
3. Frontend polls or refreshes data after AI response completion.
4. System ensures **atomic, retry-safe operations** for database and RAG indexing.
