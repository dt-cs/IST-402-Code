# Project Overview

Our meeting analysis and summarization application leverages AI to extract structured insights from meeting transcripts. The system integrates **Zoom/YouTube transcript extraction**, **AI summarization**, and **vector search** for actionable insights. 

The architecture is divided into two main layers:

1. **Frontend (React + openai-ChatKit)**
2. **Backend (Python FastAPI + Supabase + OpenAI)**

---

## 1. Overall Data Flow

1. User selects or creates a meeting in the **Sidebar**.
2. The selected `threadId` is passed to the **useMeetingAnalysis** hook.
3. The frontend requests:
   - The meeting URL (`/api/meeting/{threadId}/url`)
   - The analysis for that URL (`/api/analysis?url=...`)
4. The **backend orchestrator agent** handles:
   - Transcript extraction (YouTube/Zoom)
   - Summarization into structured JSON
   - Persistence in **Supabase**
   - Vector indexing for **RAG search**
5. Analysis is displayed in **AnalysisPanel**:
   - **Insights tab**: structured summary via `MeetingSummary`
   - **Transcript tab**: raw transcript

---

## 2. Component Overview

### Frontend
- **Sidebar** – Thread selection & navigation
- **ChatKitPanel** – AI chat interaction
- **AnalysisPanel** – Displays structured insights & raw transcript
- **MeetingSummary** – Nested component to render metadata, action items, and insights
- **useMeetingAnalysis hook** – Manages API calls and state

### Backend
- **Transcript extraction tools** – YouTube/Zoom
- **Summarizer agent** – Converts raw transcript into structured JSON
- **Save agent** – Persists transcript, summary, and embeddings to Supabase
- **RAG indexing tool** – Splits transcript, generates embeddings, stores vector chunks
- **Orchestrator agent** – Controls the workflow end-to-end

---

## 3. Key Features

- **AI-powered structured summaries** with metadata, action items, and decisions.
- **Real-time streaming updates** in the chat panel.
- **Tabbed interface** for raw transcript vs. structured insights.
- **RAG-enabled search** for meeting content.
- **Extensible architecture** for adding new meeting sources or analysis tools.
