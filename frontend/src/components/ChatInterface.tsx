import { useState, useRef, useEffect } from "react";
import { Send, Link, Bot, User, Loader2, CheckCircle2, XCircle } from "lucide-react";

// ----------------------------------------------------------------------
// 1. CONFIGURATION: Updated with your REAL Cloud Run URL
// ----------------------------------------------------------------------
const YOUTUBE_API_URL = "https://youtubecc-423771082043.us-central1.run.app";
// Keep this as placeholder until you deploy the Zoom function
const ZOOM_API_URL = "https://us-central1-YOUR_PROJECT.cloudfunctions.net/extract-zoom";

type ChatInterfaceProps = {
  onAnalysisStart: () => void;
  onAnalysisComplete: (transcript: string) => void;
};

// We updated the type to include "error" status
type Message = {
  role: "user" | "bot" | "system";
  text: string;
  status?: "loading" | "success" | "error";
};

export function ChatInterface({ onAnalysisStart, onAnalysisComplete }: ChatInterfaceProps) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    // 1. Add User Message
    const userUrl = input;
    setMessages(prev => [...prev, { role: "user", text: userUrl }]);
    setInput("");

    // 2. Trigger Real Process
    if (userUrl.includes("youtube.com") || userUrl.includes("youtu.be") || userUrl.includes("zoom.us")) {
      processLink(userUrl);
    } else {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: "bot", text: "Please provide a valid Zoom or YouTube URL." }]);
      }, 500);
    }
  };

  // ----------------------------------------------------------------------
  // 2. THE REAL API LOGIC
  // ----------------------------------------------------------------------
  const processLink = async (url: string) => {
    onAnalysisStart();

    // A. Validation UI
    setMessages(prev => [...prev, { role: "system", text: "Checking URL Validity...", status: "loading" }]);
    
    // Artificial delay (optional) to let the user read the status
    await new Promise(resolve => setTimeout(resolve, 800));

    // B. Determine API and Method based on the source
    let apiUrl = "";
    let sourceLabel = "";
    let method = "POST"; // Default to POST
    let body = null;

    if (url.includes("youtube") || url.includes("youtu.be")) {
      // YouTube Cloud Function expects a GET request with ?url=... parameter
      apiUrl = `${YOUTUBE_API_URL}?url=${encodeURIComponent(url)}`;
      sourceLabel = "YouTube Video";
      method = "GET";
    } else {
      // Assuming Zoom function still uses POST with body
      apiUrl = ZOOM_API_URL;
      sourceLabel = "Zoom Cloud Recording";
      body = JSON.stringify({ url: url });
    }

    // C. Update UI: Validation Success -> Extraction Start
    setMessages(prev => {
      const newHistory = [...prev];
      // Mark previous step as done
      newHistory[newHistory.length - 1] = { role: "system", text: `URL Validated: ${sourceLabel}`, status: "success" };
      // Add new step
      return [...newHistory, { role: "system", text: "Extracting transcript (this may take a moment)...", status: "loading" }];
    });

    try {
      // D. THE NETWORK CALL
      const fetchOptions: RequestInit = {
        method: method,
        headers: { "Content-Type": "application/json" }
      };

      if (body) {
        fetchOptions.body = body;
      }

      console.log(`Fetching: ${apiUrl}`); // Debug log

      const response = await fetch(apiUrl, fetchOptions);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json(); 
      // API return format: { "video_id": "...", "transcript": "..." }

      // E. Success UI
      setMessages(prev => {
        const newHistory = [...prev];
        newHistory[newHistory.length - 1] = { role: "system", text: "Extraction Complete.", status: "success" };
        return [...newHistory, { role: "bot", text: "I've extracted the transcript. You can view it in the panel to the right." }];
      });

      // Send data to the parent App
      onAnalysisComplete(data.transcript);

    } catch (error) {
      console.error("Extraction failed:", error);
      
      // F. Error UI
      setMessages(prev => {
        const newHistory = [...prev];
        // Mark loading step as error
        newHistory[newHistory.length - 1] = { role: "system", text: "Extraction Failed.", status: "error" };
        return [...newHistory, { role: "bot", text: "I couldn't process that link. Please check the console for CORS errors." }];
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="h-[72px] border-b border-gray-100 flex items-center px-6 justify-between bg-white shrink-0">
        <h2 className="font-semibold text-gray-800">New Conversation</h2>
        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">System Ready</span>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
        {messages.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-400">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link size={24} className="text-gray-400" />
            </div>
            <p className="font-medium text-gray-600">Paste a Zoom or YouTube link to start</p>
            <p className="text-sm">We'll transcribe and summarize it for you.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-blue-100 text-blue-600" : 
                  msg.role === "system" ? "bg-gray-100 text-gray-500" : "bg-purple-100 text-purple-600"
                }`}>
                  {msg.role === "user" ? <User size={14} /> : msg.role === "system" ? 
                    (msg.status === "error" ? <XCircle size={14} /> : <Loader2 size={14} className={msg.status === "loading" ? "animate-spin" : ""} />) 
                    : <Bot size={14} />}
                </div>
                <div className={`rounded-2xl px-4 py-3 text-sm max-w-[85%] ${
                  msg.role === "user" ? "bg-blue-600 text-white" : 
                  msg.role === "system" ? 
                    (msg.status === "error" ? "bg-red-50 border border-red-100 text-red-600 w-full" : "bg-transparent border border-gray-200 text-gray-600 w-full") 
                    : "bg-white border border-gray-100 shadow-sm text-gray-700"
                }`}>
                  <div className="flex items-center gap-2">
                    {msg.status === "success" && <CheckCircle2 size={14} className="text-green-500" />}
                    {msg.status === "error" && <XCircle size={14} className="text-red-500" />}
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="h-[96px] border-t border-gray-100 bg-white p-4 flex flex-col justify-center">
        <div className="relative flex items-center gap-2">
          <div className="absolute left-4 text-gray-400">
            <Link size={18} />
          </div>
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Paste meeting URL here..." 
            className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm"
          />
          <button onClick={handleSend} className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Send size={16} />
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Supported: YouTube, Zoom Cloud Recordings</p>
      </div>
    </div>
  );
}