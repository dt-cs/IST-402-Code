import { Calendar, CheckCircle2, Users, Lightbulb, AlertCircle, Briefcase } from "lucide-react";

// Matches the Python Pydantic model
export type MeetingData = {
  metadata: {
    meeting_title: string | null;
    date: string | null;
    project: string | null;
  };
  attendees: string[];
  summary: string;
  action_items: {
    task: string | null;
    owner: string | null;
    due: string | null;
  }[];
  insights: {
    topics: string[] | null;
    priority: string | null;
    decisions: string[] | null;
    notes: string | null;
  };
};

export function MeetingSummary({ data }: { data: MeetingData }) {
  if (!data) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. HEADER & METADATA */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h2 className="text-xl font-bold text-blue-900 mb-3">
          {data.metadata?.meeting_title || "Untitled Meeting"}
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-blue-700">
          {data.metadata?.date && (
            <div className="flex items-center gap-2">
              <Calendar size={16} className="opacity-70" />
              <span>{data.metadata.date}</span>
            </div>
          )}
          {data.metadata?.project && (
            <div className="flex items-center gap-2">
              <Briefcase size={16} className="opacity-70" />
              <span className="font-medium bg-blue-100 px-2 py-0.5 rounded-md">
                {data.metadata.project}
              </span>
            </div>
          )}
          {data.insights?.priority && (
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="opacity-70" />
              <span>Priority: <strong>{data.insights.priority}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* 2. EXECUTIVE SUMMARY */}
      <section>
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
          Executive Summary
        </h3>
        <p className="text-gray-700 leading-relaxed text-sm">
          {data.summary}
        </p>
      </section>

      {/* 3. ACTION ITEMS (The "Do" list) */}
      {data.action_items && data.action_items.length > 0 && (
        <section>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
            Action Items
            <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
              {data.action_items.length}
            </span>
          </h3>
          <div className="space-y-3">
            {data.action_items.map((item, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                <CheckCircle2 className="text-green-500 mt-0.5 shrink-0" size={18} />
                <div className="flex-1">
                  <p className="text-sm text-gray-800 font-medium">{item.task}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    {item.owner && (
                      <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                        <Users size={12} /> {item.owner}
                      </span>
                    )}
                    {item.due && (
                      <span className="text-orange-600 font-medium">Due: {item.due}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. KEY INSIGHTS & DECISIONS */}
      <section className="grid grid-cols-1 gap-4">
        {data.insights?.decisions && data.insights.decisions.length > 0 && (
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
            <h4 className="text-sm font-bold text-emerald-800 mb-2 flex items-center gap-2">
              <Lightbulb size={16} /> Key Decisions
            </h4>
            <ul className="space-y-2">
              {data.insights.decisions.map((decision, i) => (
                <li key={i} className="text-sm text-emerald-900 flex items-start gap-2">
                  <span className="block w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  {decision}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 5. ATTENDEES */}
      {data.attendees && data.attendees.length > 0 && (
        <section className="border-t border-gray-100 pt-4">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Attendees
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.attendees.map((person, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600">
                <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
                  {person.charAt(0)}
                </div>
                {person}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}