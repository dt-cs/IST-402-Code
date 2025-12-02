import { useState, useEffect, useCallback } from "react";
import type { MeetingData } from "../components/MeetingSummary";

interface AnalysisResponse {
  metadata: MeetingData;
  transcript: string;
}

export function useMeetingAnalysis(threadId: string | null) {
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<MeetingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!threadId) return;

    setIsLoading(true);
    setError(null);

    try {
      // 1) Get meeting URL
      const urlRes = await fetch(`/api/meeting/${threadId}/url`);
      if (!urlRes.ok) throw new Error("Failed to fetch meeting URL");

      const urlData = await urlRes.json();
      if (!urlData.url) throw new Error("No meeting URL found");

      const meetingUrl = urlData.url;

      // 2) Get meeting analysis
      const analysisRes = await fetch(
        `/api/analysis?url=${encodeURIComponent(meetingUrl)}`
      );
      if (!analysisRes.ok) throw new Error("Failed to fetch meeting analysis");

      const analysis = (await analysisRes.json()) as AnalysisResponse;

      setTranscript(analysis.transcript ?? null);
      setSummary(analysis.metadata ?? null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch meeting analysis.");
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  // OPTIONAL: fetch when threadId first appears
  useEffect(() => {
    if (threadId) refresh();
  }, [threadId, refresh]);

  return { transcript, summary, isLoading, error, refresh };
}