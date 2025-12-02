import { MessageSquare, Plus } from "lucide-react";

export function Sidebar() {
  return (
    <div className="flex h-full w-64 shrink-0 flex-col border-r border-gray-100 bg-white">
      
      {/* HEADER: Fixed Height 72px */}
      <div className="h-[72px] flex items-center px-4 border-b border-gray-100">
        <span className="grid h-10 w-32 place-content-center rounded-lg bg-gray-100 text-xs font-bold text-gray-600 tracking-widest uppercase">
          MeetSumm
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          <li>
            <button className="w-full flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
               <Plus size={16} />
               New Meeting
            </button>
          </li>

          <li className="pt-4">
             <span className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
               Recent
             </span>
          </li>

          <ThreadItem label="Q4 Marketing Strategy" active />
          <ThreadItem label="Engineering Standup" />
          <ThreadItem label="Client Kickoff: Acme" />
        </ul>
      </div>

      {/* FOOTER: Fixed Height 96px for alignment */}
      <div className="h-[72px] border-t border-gray-100 bg-white p-4 flex items-center">
        <a href="#" className="flex items-center gap-2 hover:bg-gray-50 transition-colors rounded-lg p-2 w-full">
          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
             <span className="font-bold text-sm">EF</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-xs">
              <strong className="block font-medium text-gray-900 truncate">Eric Frusciante</strong>
              <span className="text-gray-500 truncate block"> eric@frusciante.com </span>
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}

function ThreadItem({ label, active }: { label: string, active?: boolean }) {
  return (
    <li>
      <a
        href="#"
        className={`block rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
          active
            ? "bg-gray-100 text-gray-700"
            : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        }`}
      >
        <div className="flex items-center gap-2">
           <MessageSquare size={16} />
           <span className="truncate">{label}</span>
        </div>
      </a>
    </li>
  );
}