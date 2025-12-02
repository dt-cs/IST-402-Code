import { StartScreenPrompt } from "@openai/chatkit-react";

// 1. Connection Settings
export const CHATKIT_API_URL = 
  import.meta.env.VITE_CHATKIT_API_URL ?? "http://127.0.0.1:8000/chatkit";

export const CHATKIT_API_DOMAIN_KEY = 
  import.meta.env.VITE_CHATKIT_API_DOMAIN_KEY ?? "domain_pk_localhost_dev";

// 3. The Personality
export const GREETING = "I am your AI Meeting Secretary. Paste a Zoom or YouTube link, and I will extract the insights.";

// 4. Starter Chips - FIXED ICONS
// Valid icons are typically: "document", "sparkle", "globe", "lightbulb", "search", "image", "code"
export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "Analyze YouTube Video",
    prompt: "Here is a YouTube link I want to analyze: ",
    icon: "document", // Changed from 'youtube'
  },
  {
    label: "Zoom Recording",
    prompt: "I have a Zoom cloud recording to process: ",
    icon: "document", // Changed from 'video'
  },
  {
    label: "Extract Action Items",
    prompt: "Can you list the key action items from the last transcript?",
    icon: "sparkle", // Changed from 'clipboard-list'
  },
];

export const getPlaceholder = (hasThread: boolean) => {
  return hasThread
    ? "Ask a question about the meeting..."
    : "Paste a meeting URL here...";
};