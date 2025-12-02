import { ChatKit, useChatKit } from "@openai/chatkit-react";
import {
  CHATKIT_API_DOMAIN_KEY,
  CHATKIT_API_URL,
  GREETING,
  STARTER_PROMPTS,
  getPlaceholder,
} from "../lib/config";

type ChatKitPanelProps = {
  onThreadChange: (threadId: string | null) => void;
  onResponseCompleted: () => void;
};

export function ChatKitPanel({ onThreadChange, onResponseCompleted,}: ChatKitPanelProps) {
  
  // --- ChatKit hook ---
  const chatkit = useChatKit({
    api: {
      url: CHATKIT_API_URL,
      domainKey: CHATKIT_API_DOMAIN_KEY,
    },
    theme: {
      density: "compact",
      colorScheme: "light",
      radius: "round",
      color: {
        accent: { primary: "#2563eb", level: 1 },
        grayscale: { hue: 220, tint: 0, shade: 0 },
      },
      typography: { fontFamily: "Inter, system-ui, sans-serif" },
    },
    startScreen: {
      greeting: GREETING,
      prompts: STARTER_PROMPTS,
    },
    composer: {
      placeholder: getPlaceholder(false),
    },
    onResponseEnd: () => {
      onResponseCompleted();
    },
    onThreadChange: ({ threadId }) => {
      onThreadChange(threadId ?? null);
    },
    onError: ({ error }) => {
      // ChatKit displays surfaced errors; we keep logging for debugging.
      console.error("ChatKit error", error);
    },
  });

  return (
    <div className="flex flex-col h-full w-full bg-white relative">
      {/* HEADER */}
      <div className="h-[72px] border-b border-gray-100 flex items-center px-6 justify-between bg-white shrink-0 z-10">
        <h2 className="font-semibold text-gray-800">New Conversation</h2>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">System Ready</span>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 min-h-0 relative">
        <ChatKit control={chatkit.control} className="block h-full w-full" />
      </div>

      {/* CUSTOM FOOTER */}
      <div className="h-[96px] border-t border-gray-100 bg-white p-4 flex flex-col justify-center shrink-0 z-20">
        <p className="text-center text-xs text-gray-400">Supported: YouTube, Zoom Cloud Recordings</p>
      </div>
    </div>
  );
}