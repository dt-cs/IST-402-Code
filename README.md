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

---

## 4. Roles & Responsibilities

### **Deebak Tamilmani — Backend & AI Pipeline Lead**
- Builds and maintains the backend architecture, including FastAPI services, endpoints, and data flow.
- Implements all backend logic for handling incoming URLs, triggering the transcription workflow, and orchestrating agent tool calls.
- Manages the integration of AI models for summarization, action-item extraction, metadata detection, and vector database updates.
- Handles database interactions, thread/session management, and backend-side error handling.
- Ensures the backend delivers clean, structured outputs for the frontend to render.
- Oversees the authentication and ChatKit session backend logic.


### **Andreea — Frontend UI/UX & Chat Interface Lead**
- Designs and implements the full frontend interface using React and ChatKit SDK.
- Creates the user journey for entering URLs, receiving AI responses, and navigating between transcript, summary, and action items.
- Implements the chat UI, collapsible components, and interactive elements used throughout the app.
- Ensures seamless streaming of messages and consistent rendering of AI outputs.
- Works closely with backend output formats to build user-friendly UI experiences.
- Responsible for styling, component structure, and overall UX coherence.


### **Tsehynesh — RAG Pipeline, API Fetch Design & Summary UI Lead**
- Builds and maintains the Retrieval-Augmented Generation (RAG) workflow: vector storage, embeddings, and search logic.
- Implements frontend API fetch designs for pulling summaries, action items, and transcript insights from the backend.
- Develops the frontend **Summary Panel**, including structured display for:
  - overall meeting summary  
  - key insights  
  - tasks and deadlines  
  - participants and metadata
- Ensures the vector database results are properly formatted and surfaced in the UI.

---

## Acknowledgements

This project was developed with assistance from modern AI tools that supported debugging, and code generation throughout the development process.

- **ChatGPT (OpenAI)**
- **Google Gemini** 
