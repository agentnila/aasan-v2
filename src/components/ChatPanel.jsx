import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import MessageBubble from "./MessageBubble";

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-5";
const SYSTEM_PROMPT = `You are Peraasan, the AI learning agent inside Aasan — Your Personal University for enterprises.

Your personality: warm, encouraging, concise, action-oriented. You are the employee's personal learning companion.

What you do:
- Help employees find and learn content from any source (Coursera, Confluence, Google Drive, LMS, YouTube, web)
- Build personalised learning paths based on their goals and what they already know
- Recommend what to learn next (always goal-anchored)
- Track knowledge in a permanent knowledge graph (you never forget what they learned)
- Schedule learning sessions ("Start now with just 5 minutes, or I can find calendar slots")
- Review for retention (spaced review — "Remember Forever")

Rules:
- Keep responses under 150 words unless teaching a concept
- Always tie recommendations back to their goal
- When suggesting content, offer: "Start now (just 5 min) or schedule for later?"
- Be encouraging but never annoying
- If they seem stuck, use micro-commitments ("just read the first paragraph")
- You are an agent that ACTS for them, not just answers questions`;

function getInitialMessages(name) {
  return [
    {
      id: 1,
      role: "peraasan",
      content: `Good to see you, ${name}! What do you want to learn today?`,
      timestamp: new Date(),
    },
  ];
}

const QUICK_ACTIONS = [
  "What should I learn next?",
  "Show my progress",
  "I have 15 minutes",
  "Review something",
];

export default function ChatPanel({ onContextChange, userName }) {
  const { user } = useUser();
  const [messages, setMessages] = useState(() => getInitialMessages(userName || 'there'));
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text) {
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Build conversation history for Claude
      const conversationHistory = messages.slice(-10).map((m) => ({
        role: m.role === "peraasan" ? "assistant" : "user",
        content: m.content,
      }));
      conversationHistory.push({ role: "user", content: text.trim() });

      // Call Claude API directly
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: CLAUDE_MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT + `\n\nThe employee's name is ${userName || "there"}.`,
          messages: conversationHistory,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const replyText = data.content?.[0]?.text || "I'm thinking about that...";
        const peraasanMsg = {
          id: Date.now() + 1,
          role: "peraasan",
          content: replyText,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, peraasanMsg]);
      } else {
        const fallback = generateResponse(text.trim());
        setMessages((prev) => [...prev, fallback]);
      }
    } catch (err) {
      console.log("Claude API unavailable, using simulated response:", err.message);
      const fallback = generateResponse(text.trim());
      setMessages((prev) => [...prev, fallback]);
    }

    setIsTyping(false);

    // Update context panel based on conversation
    const lower = text.toLowerCase();
    if (lower.includes("progress") || lower.includes("readiness")) {
      onContextChange({ type: "progress" });
    } else if (lower.includes("learn") || lower.includes("kubernetes") || lower.includes("next")) {
      onContextChange({ type: "learning_path" });
    }
  }

  function generateResponse(text) {
    const lower = text.toLowerCase();

    if (lower.includes("what should") || lower.includes("next") || lower.includes("recommend")) {
      return {
        id: Date.now() + 1,
        role: "peraasan",
        content: "Based on your Cloud Architect goal and current knowledge, here's what I recommend next:",
        cards: [
          {
            type: "recommendation",
            primary: {
              title: "Kubernetes Networking — Services & Ingress",
              source: "Coursera (your company has access)",
              duration: "35 min",
              reason: "Your networking gap is blocking 4 advanced topics. Closing it shifts your readiness from 62 → 68.",
            },
            alternatives: [
              { title: "AWS Lambda Deep Dive", source: "LinkedIn Learning", duration: "45 min" },
              { title: "Internal: Platform Team Architecture Doc", source: "Confluence", duration: "15 min" },
            ],
          },
          {
            type: "scheduling",
            message: "You can start now with just 5 minutes of learning, or I can look at your calendar and propose a few 15-minute slots this week. What works for you?",
            actions: [
              { label: "Start now (just 5 min)", action: "start_now" },
              { label: "Find slots in my calendar", action: "find_slots" },
              { label: "Schedule for tomorrow morning", action: "schedule_tomorrow" },
            ],
          },
        ],
        timestamp: new Date(),
      };
    }

    if (lower.includes("find slots") || lower.includes("schedule") || lower.includes("calendar")) {
      return {
        id: Date.now() + 1,
        role: "peraasan",
        content: "I checked your Google Calendar. Here are 3 open slots this week that work for a 15-minute learning session:",
        cards: [{
          type: "calendar_slots",
          slots: [
            { day: "Today", time: "2:00 – 2:15 PM", status: "free", fit: "After your standup, before the design review" },
            { day: "Tomorrow", time: "9:00 – 9:15 AM", status: "free", fit: "Start your day with learning — your most productive time" },
            { day: "Wednesday", time: "12:30 – 12:45 PM", status: "free", fit: "Lunch break slot — quick and focused" },
          ],
        }],
        timestamp: new Date(),
      };
    }

    if (lower.includes("start now") || lower.includes("start:") || lower.includes("just 5")) {
      return {
        id: Date.now() + 1,
        role: "peraasan",
        content: "Let's go. Just 5 minutes — that's all you need to start.\n\nI'm opening Kubernetes Networking on Coursera for you now. I'll keep time and let you know when 5 minutes is up. You can always keep going if you're in the flow.\n\nWhile you learn, I'll capture key concepts for your knowledge graph. Ready?",
        cards: [{
          type: "focus_start",
          title: "Kubernetes Networking — Services & Ingress",
          source: "Coursera",
          commitment: "5 min (extend anytime)",
        }],
        timestamp: new Date(),
      };
    }

    if (lower.includes("progress") || lower.includes("readiness") || lower.includes("how am i")) {
      return {
        id: Date.now() + 1,
        role: "peraasan",
        content: "Here's where you stand on your Cloud Architect goal:",
        cards: [{
          type: "progress",
          goal: "Cloud Architect",
          readiness: 62,
          trend: "rising",
          concepts: 42,
          gaps: 3,
          streak: 8,
          topGap: "Kubernetes Networking",
        }],
        timestamp: new Date(),
      };
    }

    if (lower.includes("15 min") || lower.includes("quick") || lower.includes("short")) {
      return {
        id: Date.now() + 1,
        role: "peraasan",
        content: "15 minutes? Perfect. Here's what fits:",
        cards: [{
          type: "quick_options",
          options: [
            { title: "Quick review: Kubernetes Pods (2 min)", type: "review", icon: "↻" },
            { title: "Read: Platform Team Architecture Doc (12 min)", type: "content", icon: "📄" },
            { title: "Watch: AWS IAM in 10 minutes (10 min)", type: "video", icon: "▶" },
          ],
        }],
        timestamp: new Date(),
      };
    }

    if (lower.includes("review")) {
      return {
        id: Date.now() + 1,
        role: "peraasan",
        content: "Let's check your retention. Here's one from last week:",
        cards: [{
          type: "review",
          concept: "Kubernetes Pods",
          question: "What's the difference between a Pod and a Container in Kubernetes?",
        }],
        timestamp: new Date(),
      };
    }

    if (lower.includes("kubernetes") || lower.includes("k8s")) {
      return {
        id: Date.now() + 1,
        role: "peraasan",
        content: "Great choice. I've found the best Kubernetes content across your company's sources. Here's your personalised path:",
        cards: [{
          type: "learning_path",
          title: "Kubernetes for Cloud Architects",
          steps: [
            { title: "Container Fundamentals", status: "known", duration: "20 min" },
            { title: "Pod Architecture", status: "known", duration: "30 min" },
            { title: "Services & Networking", status: "next", duration: "35 min" },
            { title: "Deployments & Scaling", status: "pending", duration: "40 min" },
            { title: "Helm & Package Management", status: "pending", duration: "30 min" },
            { title: "Internal: Your Team's K8s Setup", status: "pending", duration: "15 min" },
          ],
        }],
        timestamp: new Date(),
      };
    }

    return {
      id: Date.now() + 1,
      role: "peraasan",
      content: `I hear you. In the full version, I'd search your company's entire content index (Coursera, Confluence, Drive, LMS) and build a personalised path for "${text}". For now, try asking about Kubernetes, your progress, or what to learn next.`,
      timestamp: new Date(),
    };
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-white">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-navy to-columbia-blue flex items-center justify-center text-white text-[10px] font-semibold">
          P
        </div>
        <div>
          <h1 className="text-[14px] font-semibold text-text-primary">Peraasan</h1>
          <p className="text-[10px] text-green-500">Online · Your AI learning agent</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 no-scrollbar">
        <div className="max-w-2xl mx-auto flex flex-col gap-5">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} onAction={sendMessage} />
          ))}
          {isTyping && (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-columbia-blue flex items-center justify-center text-white text-[10px] font-semibold shrink-0">
                P
              </div>
              <div className="flex items-center gap-1 bg-chat-ai rounded-2xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      {/* Quick actions */}
      {messages.length <= 2 && (
        <div className="px-6 pb-2">
          <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action}
                onClick={() => sendMessage(action)}
                className="shrink-0 px-4 py-2 text-[12px] rounded-full border border-gray-200 text-text-primary hover:bg-navy hover:text-white hover:border-navy transition-all"
              >
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-5 border-t border-gray-100 bg-white">
        <div className="max-w-2xl mx-auto flex gap-3">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage(input);
              }
            }}
            placeholder="Ask Peraasan anything..."
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-[14px] text-text-primary placeholder-gray-400 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all resize-none min-h-[52px] max-h-[140px]"
            rows={2}
            autoFocus
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className={`px-6 py-3 rounded-xl text-[13px] font-medium transition-all self-end ${
              input.trim()
                ? "bg-navy text-white hover:bg-navy/90"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
