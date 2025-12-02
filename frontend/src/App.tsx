import React, { useState, useRef, useEffect, useCallback } from "react";
import { Sidebar } from "./components/Sidebar";
import { ChatKitPanel } from "./components/ChatKitPanel";
import { AnalysisPanel } from "./components/AnalysisPanel";
import { useMeetingAnalysis } from "./hooks/useMeetingAnalysis";

export default function Home() {
  const [threadId, setThreadId] = useState<string | null>(null);

  const {
    transcript,
    summary,
    isLoading,
    error,
    refresh
  } = useMeetingAnalysis(threadId);

  const handleResponseCompleted = useCallback(() => {
    // only fetch AFTER agent finishes responding
    void refresh();
  }, [refresh]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-sm font-sans">
      <Sidebar />

      <main className="w-[400px] shrink-0 border-r border-gray-200 h-full">
        <ChatKitPanel
        onResponseCompleted={handleResponseCompleted}
        onThreadChange={setThreadId}
        />
      </main>

      <div className="flex-1 min-w-0 bg-white h-full overflow-y-auto">
        <AnalysisPanel
        transcript={transcript}
        summary={summary}
        loading={isLoading}
        />
      </div>
    </div>
  );
}