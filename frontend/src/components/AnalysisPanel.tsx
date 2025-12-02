import { useState } from "react";
import { FileText, Sparkles, Download, Copy, Loader2 } from "lucide-react";
import { MeetingSummary } from "./MeetingSummary";
// Import the type properly
import type { MeetingData } from "./MeetingSummary";

type AnalysisPanelProps = {
  transcript: string | null;
  summary: MeetingData | null; // <--- ADDED THIS PROP
  loading: boolean;
};

export function AnalysisPanel({ transcript, summary, loading }: AnalysisPanelProps) {
  const [activeTab, setActiveTab] = useState<"insights" | "transcript">("insights");

  // Helper to display line breaks in transcript
  const renderTranscript = (text: string) => {
    return text.split("\n").map((line, i) => (
      <p key={i} className="mb-4 text-gray-700 leading-relaxed">
        {line}
      </p>
    ));
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-gray-100">
      
      {/* HEADER */}
      <div className="h-[72px] flex items-center px-6 border-b border-gray-100 shrink-0">
        <div role="tablist" className="flex gap-2">
          <button
            onClick={() => setActiveTab("insights")}
            role="tab"
            aria-selected={activeTab === "insights"}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "insights"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Sparkles size={14} />
            Insights
          </button>

          <button
            onClick={() => setActiveTab("transcript")}
            role="tab"
            aria-selected={activeTab === "transcript"}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === "transcript"
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FileText size={14} />
            Raw Transcript
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 overflow-y-auto p-8 bg-white">
        
        {/* LOADING STATE */}
        {loading && !summary && (
           <div className="h-full flex flex-col items-center justify-center text-center">
              <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
              <h3 className="text-gray-900 font-medium">Analyzing Meeting...</h3>
              <p className="text-sm text-gray-500 mt-1">Extracting insights & action items.</p>
           </div>
        )}

        {/* EMPTY STATE */}
        {!loading && !transcript && !summary && (
          <div className="border border-dashed border-gray-200 rounded-xl p-12 text-center h-full flex flex-col items-center justify-center">
             <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="text-gray-400" size={24} />
             </div>
             <h3 className="text-gray-900 font-medium mb-1">No insights yet</h3>
             <p className="text-sm text-gray-500 max-w-xs mx-auto">
               Submit a meeting link to generate a summary.
             </p>
          </div>
        )}

        {/* DATA DISPLAY */}
        {(transcript || summary) && (
          <>
            {activeTab === "insights" ? (
              summary ? (
                // RENDER THE NEW COMPONENT DIRECTLY FROM PROP
                <MeetingSummary data={summary} />
              ) : (
                // Fallback while waiting for the summary
                <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                    <FileText className="text-gray-400" size={24} />
                  </div>
                  <h4 className="text-gray-900 font-medium mb-1">Raw Transcript Available</h4>
                  <p className="text-sm text-gray-500 max-w-sm">
                    The AI hasn't structured the data yet. Check back in a moment or view the Raw Transcript.
                  </p>
                  <button 
                    onClick={() => setActiveTab("transcript")}
                    className="mt-4 text-blue-600 font-medium text-sm hover:underline"
                  >
                    View Transcript &rarr;
                  </button>
                </div>
              )
            ) : (
              <div className="font-mono text-sm text-gray-700 leading-relaxed">
                {renderTranscript(transcript || "No transcript text available.")}
              </div>
            )}
          </>
        )}
      </div>

      {/* FOOTER */}
      <div className="h-[96px] border-t border-gray-100 bg-white px-6 flex items-center justify-between shrink-0">
         <div className="text-xs text-gray-400 font-medium">
            Analysis Tools
         </div>
         <div className="flex gap-2">
            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Copy to Clipboard">
               <Copy size={18} />
            </button>
            <button className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Export PDF">
               <Download size={18} />
            </button>
         </div>
      </div>

    </div>
  );
}