# MeetSumm Frontend Architecture

The frontend is a **React/TypeScript** application designed for interacting with AI-driven meeting analysis.

---

## 1. Root Component

### `App.tsx`
- Layout:
  - **Sidebar** – navigation & thread selection
  - **ChatKitPanel** – AI interaction & streaming responses
  - **AnalysisPanel** – displays structured insights and raw transcript
- Maintains `threadId` state.
- Uses `useMeetingAnalysis` hook to fetch analysis data.
- Handles refresh after AI responses finish.

---

## 2. Main Components

### a) Sidebar
- Displays:
  - Brand/logo
  - New meeting button
  - Recent threads (`ThreadItem` nested component)
  - User profile footer
- Updates `threadId` for the active meeting.

### b) ChatKitPanel
- Integrates **ChatKit** via `useChatKit`.
- Handles:
  - AI responses
  - Error logging
  - Callbacks:
    - `onThreadChange` → update active thread
    - `onResponseCompleted` → refresh analysis data

### c) AnalysisPanel
- Displays:
  - Insights tab (`MeetingSummary` component)
  - Raw transcript tab
- Handles states:
  - Loading
  - Empty
  - Data display
- Footer provides copy/export buttons.

### d) Nested Component: MeetingSummary
- Renders structured meeting data:
  - Metadata, action items, key decisions, attendees
- Fully reusable inside AnalysisPanel.

---

## 3. Custom Hook: `useMeetingAnalysis`
- Handles API calls to backend.
- Fetches:
  - Meeting URL
  - Meeting analysis
- Stores state:
  - `transcript`
  - `summary`
  - `isLoading`
  - `error`
- Exposes `refresh()` for manual or callback-triggered updates.

---

## 4. Data Flow Summary

1. User selects a meeting from **Sidebar**.
2. `threadId` triggers `useMeetingAnalysis` fetch.
3. ChatKitPanel streams AI responses.
4. After response, `onResponseCompleted` triggers refresh.
5. AnalysisPanel displays:
   - Structured summary (`MeetingSummary`)
   - Raw transcript
6. Users can copy/export insights or view decisions/actions.

---

## 5. Key Features
- **Streaming AI responses** via ChatKit
- **Tabbed interface**: insights vs transcript
- **Reusable components** for metadata and action items
- **Stateful hooks** for consistent API integration
- **Clean UX** with loading and empty states
