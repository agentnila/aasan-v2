import { useState, useRef, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import MessageBubble from "./MessageBubble";
import { captureSession, completeReview, addMemory, searchContent } from "../services/api";

const CLAUDE_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const CLAUDE_MODEL = "claude-sonnet-4-5";
const HAIKU_MODEL = "claude-haiku-4-5-20251001";

const BASE_SYSTEM_PROMPT = `You are Peraasan, the AI learning agent inside Aasan — Your Personal University for enterprises.

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

function buildSystemPrompt(userName, context) {
  let prompt = BASE_SYSTEM_PROMPT + `\n\nThe employee's name is ${userName || "there"}.`;

  if (context?.memories && context.memories.length > 0) {
    prompt += `\n\nHere is what you remember about this employee from previous sessions:\n`;
    context.memories.forEach((mem, i) => {
      const text = typeof mem === 'string' ? mem : (mem.memory || mem.text || mem.content || JSON.stringify(mem));
      prompt += `${i + 1}. ${text}\n`;
    });
  }

  if (context?.knowledge) {
    prompt += `\n\nCurrent knowledge stats: ${context.knowledge.total_concepts || 0} concepts in graph, ${context.knowledge.gaps || 0} gaps, average mastery ${context.knowledge.avg_mastery || 0}%.`;
  }

  if (context?.reviews_due && context.reviews_due.length > 0) {
    prompt += `\n\n${context.reviews_due.length} concepts are due for spaced review: ${context.reviews_due.map(r => r.concept_name || r.name || r).join(', ')}.`;
  }

  return prompt;
}

const GOAL_ONBOARDING_GREETING = "Welcome to Aasan \u2014 your Personal University! I'm Peraasan, your AI learning agent. Before we start, let's set your learning goal. What do you want to achieve? It could be a certification, a skill, a promotion, or anything you're working toward.";

const GOAL_FOLLOWUPS = [
  (goal) => `Great goal! Why is "${goal}" important to you right now?`,
  (_obj) => "When would you like to achieve this by?",
  (_tl) => "How will you know you've succeeded? What's the success criteria?",
];

function isGoalSet() {
  return localStorage.getItem('aasan_goal_set') === 'true';
}

function getSavedGoal() {
  try {
    return JSON.parse(localStorage.getItem('aasan_goal') || 'null');
  } catch { return null; }
}

function getInitialGreeting(name, context) {
  // If no goal is set, show onboarding greeting
  if (!isGoalSet()) {
    return GOAL_ONBOARDING_GREETING;
  }

  if (!context) {
    return `Good to see you, ${name}! Loading your knowledge graph...`;
  }

  const concepts = context.knowledge?.total_concepts || 0;
  const gaps = context.knowledge?.gaps || 0;
  const reviewsDue = context.reviews_due || [];

  if (reviewsDue.length > 0) {
    const estMin = Math.max(1, reviewsDue.length);
    return `Good to see you, ${name}! You have ${concepts} concepts in your graph${gaps > 0 ? ` and ${gaps} gaps to close` : ''}. You also have ${reviewsDue.length} concept${reviewsDue.length === 1 ? '' : 's'} due for review. Want to knock those out first? (${estMin} min)`;
  }

  if (concepts > 0) {
    return `Good to see you, ${name}! You have ${concepts} concepts in your graph${gaps > 0 ? ` and ${gaps} gaps to close` : ''}. What do you want to learn today?`;
  }

  return `Good to see you, ${name}! What do you want to learn today?`;
}

const QUICK_ACTIONS = [
  "What should I learn next?",
  "Show my progress",
  "I have 15 minutes",
  "Review something",
];

export default function ChatPanel({ onContextChange, userName, context, userId }) {
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [reviewMode, setReviewMode] = useState(null); // { concept, question, index }
  // Goal onboarding: 0=ask goal, 1=ask why, 2=ask when, 3=ask criteria, 4=done
  const [goalStep, setGoalStep] = useState(isGoalSet() ? 4 : 0);
  const [goalData, setGoalData] = useState({ goal: '', objective: '', timeline: '', criteria: '' });
  const endRef = useRef(null);
  const contextLoadedRef = useRef(false);

  // Set initial greeting, update when context loads
  useEffect(() => {
    if (context && !contextLoadedRef.current) {
      contextLoadedRef.current = true;
      const greeting = getInitialGreeting(userName || 'there', context);
      setMessages([{
        id: 1,
        role: "peraasan",
        content: greeting,
        timestamp: new Date(),
      }]);
    } else if (!contextLoadedRef.current && messages.length === 0) {
      setMessages([{
        id: 1,
        role: "peraasan",
        content: getInitialGreeting(userName || 'there', null),
        timestamp: new Date(),
      }]);
    }
  }, [context, userName]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Background: extract concepts from conversation and capture to backend
  async function extractAndCapture(userText, assistantText) {
    try {
      const extractionPrompt = "Extract key concepts from this learning conversation. Return JSON: { concepts: [{ name, definition, subject, domain, confidence, is_gap, gap_type, connects_to }], summary: string }. If this is NOT a learning conversation (just casual chat, greetings, etc.), return { concepts: [], summary: null }.";

      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: HAIKU_MODEL,
          max_tokens: 1024,
          system: extractionPrompt,
          messages: [
            { role: "user", content: userText },
            { role: "assistant", content: assistantText },
          ],
        }),
      });

      if (!response.ok) return;

      const data = await response.json();
      const text = data.content?.[0]?.text || '';

      // Parse JSON from response (handle markdown code blocks)
      let parsed;
      try {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, text];
        parsed = JSON.parse(jsonMatch[1].trim());
      } catch {
        console.log('[Capture] Could not parse extraction response');
        return;
      }

      if (!parsed.concepts || parsed.concepts.length === 0) {
        console.log('[Capture] No learning concepts detected, skipping capture');
        return;
      }

      // Capture to backend
      const uid = userId || user?.id;
      if (!uid) return;

      await captureSession({
        userId: uid,
        title: parsed.summary || 'Chat learning session',
        concepts: parsed.concepts,
        gaps: parsed.concepts.filter(c => c.is_gap),
        summary: parsed.summary || '',
        duration: 5,
      });

      console.log(`[Capture] Saved ${parsed.concepts.length} concepts to backend`);
    } catch (err) {
      console.error('[Capture] Background extraction failed:', err.message);
    }
  }

  // Handle spaced review flow
  async function handleReviewResponse(userText) {
    if (!reviewMode) return false;

    const lower = userText.toLowerCase();

    // User is responding to a review question
    if (reviewMode.question) {
      // Let Claude evaluate the answer
      setIsTyping(true);
      try {
        const evalResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({
            model: HAIKU_MODEL,
            max_tokens: 512,
            system: `You are evaluating a spaced review answer about "${reviewMode.concept}". Rate it 0-5 (SM-2 scale: 0=complete blank, 3=correct with difficulty, 5=perfect). Respond with JSON: { rating: number, feedback: string }`,
            messages: [
              { role: "user", content: `Question: ${reviewMode.question}\nAnswer: ${userText}` },
            ],
          }),
        });

        let rating = 3;
        let feedback = "Got it! Let's keep going.";

        if (evalResponse.ok) {
          const evalData = await evalResponse.json();
          const evalText = evalData.content?.[0]?.text || '';
          try {
            const jsonMatch = evalText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, evalText];
            const parsed = JSON.parse(jsonMatch[1].trim());
            rating = parsed.rating ?? 3;
            feedback = parsed.feedback || feedback;
          } catch {
            // use defaults
          }
        }

        // Save review result to backend
        const uid = userId || user?.id;
        if (uid) {
          completeReview(uid, reviewMode.concept, rating).catch(err =>
            console.error('[Review] Failed to save:', err.message)
          );
        }

        const ratingEmoji = rating >= 4 ? 'Excellent!' : rating >= 3 ? 'Good.' : 'No worries, we will review again soon.';

        // Check if there are more reviews
        const reviewsDue = context?.reviews_due || [];
        const nextIndex = (reviewMode.index || 0) + 1;

        let replyContent = `${ratingEmoji} ${feedback}`;

        if (nextIndex < reviewsDue.length) {
          const nextReview = reviewsDue[nextIndex];
          const nextConcept = nextReview.concept_name || nextReview.name || nextReview;
          replyContent += `\n\nNext up: **${nextConcept}**. What do you know about ${nextConcept}?`;
          setReviewMode({ concept: nextConcept, question: `What do you know about ${nextConcept}?`, index: nextIndex });
        } else {
          replyContent += '\n\nAll reviews done! Your memory is getting stronger. What else would you like to work on?';
          setReviewMode(null);
        }

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: "peraasan",
          content: replyContent,
          timestamp: new Date(),
        }]);
      } catch (err) {
        console.error('[Review] Evaluation failed:', err.message);
        setReviewMode(null);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          role: "peraasan",
          content: "Review recorded! What else would you like to work on?",
          timestamp: new Date(),
        }]);
      }
      setIsTyping(false);
      return true;
    }

    return false;
  }

  // Start the review flow
  function startReviewFlow() {
    const reviewsDue = context?.reviews_due || [];
    if (reviewsDue.length === 0) return;

    const first = reviewsDue[0];
    const conceptName = first.concept_name || first.name || first;
    const question = `What do you know about ${conceptName}?`;

    setReviewMode({ concept: conceptName, question, index: 0 });

    setMessages(prev => [...prev, {
      id: Date.now() + 1,
      role: "peraasan",
      content: `Let's review! First up: **${conceptName}**.\n\n${question}`,
      timestamp: new Date(),
    }]);
  }

  // Handle goal onboarding flow — returns true if intercepted
  async function handleGoalOnboarding(text) {
    if (goalStep >= 4) return false; // goal already set

    const trimmed = text.trim();

    if (goalStep === 0) {
      // User just told us their goal
      setGoalData(prev => ({ ...prev, goal: trimmed }));
      setGoalStep(1);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "peraasan",
        content: GOAL_FOLLOWUPS[0](trimmed),
        timestamp: new Date(),
      }]);
      return true;
    }

    if (goalStep === 1) {
      // User told us why
      setGoalData(prev => ({ ...prev, objective: trimmed }));
      setGoalStep(2);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "peraasan",
        content: GOAL_FOLLOWUPS[1](trimmed),
        timestamp: new Date(),
      }]);
      return true;
    }

    if (goalStep === 2) {
      // User told us timeline
      setGoalData(prev => ({ ...prev, timeline: trimmed }));
      setGoalStep(3);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "peraasan",
        content: GOAL_FOLLOWUPS[2](trimmed),
        timestamp: new Date(),
      }]);
      return true;
    }

    if (goalStep === 3) {
      // User told us criteria — finalize goal
      const finalGoal = {
        goal: goalData.goal,
        objective: goalData.objective,
        timeline: goalData.timeline,
        criteria: trimmed,
      };

      // Save to localStorage
      localStorage.setItem('aasan_goal', JSON.stringify(finalGoal));
      localStorage.setItem('aasan_goal_set', 'true');
      setGoalData(finalGoal);
      setGoalStep(4);

      // Save to Mem0
      const uid = userId || user?.id;
      if (uid) {
        addMemory(uid, `Learning goal: ${finalGoal.goal}. Why: ${finalGoal.objective}. Timeline: ${finalGoal.timeline}. Success criteria: ${finalGoal.criteria}`).catch(err =>
          console.error('[Goal] Failed to save to Mem0:', err.message)
        );
      }

      const summary = `Perfect. Here's your goal:\n\n\ud83c\udfaf Goal: ${finalGoal.goal}\n\ud83d\udccc Why: ${finalGoal.objective}\n\ud83d\udcc5 By: ${finalGoal.timeline}\n\u2705 Success: ${finalGoal.criteria}\n\nI'll anchor everything I recommend to this. Let's start \u2014 what do you want to learn today?`;

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "peraasan",
        content: summary,
        timestamp: new Date(),
      }]);
      return true;
    }

    return false;
  }

  // Search content index, returns array of results or empty array
  async function fetchContentResults(query) {
    try {
      const res = await searchContent(query);
      const items = res?.results || res?.items || (Array.isArray(res) ? res : []);
      return items;
    } catch (err) {
      console.log('[Content] Search failed:', err.message);
      return [];
    }
  }

  // Detect learning intent keywords
  function hasLearningIntent(text) {
    const lower = text.toLowerCase();
    const keywords = ['learn', 'teach', 'study', 'how to', 'what is', 'explain', 'understand', 'tutorial', 'course'];
    return keywords.some(k => lower.includes(k));
  }

  // Detect recommendation intent
  function hasRecommendationIntent(text) {
    const lower = text.toLowerCase();
    return lower.includes('what should') || lower.includes('recommend') || lower.includes('learn next') || lower.includes('suggest');
  }

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

    // Goal onboarding intercept
    if (goalStep < 4) {
      const handled = await handleGoalOnboarding(text.trim());
      if (handled) return;
    }

    // Check if user wants to start review
    const lower = text.trim().toLowerCase();
    const reviewsDue = context?.reviews_due || [];
    if (!reviewMode && reviewsDue.length > 0 && (lower === 'yes' || lower === 'review' || lower === 'sure' || lower === "let's review" || lower === "knock them out" || lower === 'yeah')) {
      startReviewFlow();
      return;
    }

    // Check if user is responding to a review question
    if (reviewMode) {
      const handled = await handleReviewResponse(text.trim());
      if (handled) return;
    }

    setIsTyping(true);

    try {
      // Build conversation history for Claude
      const conversationHistory = messages.slice(-10).map((m) => ({
        role: m.role === "peraasan" ? "assistant" : "user",
        content: m.content,
      }));
      conversationHistory.push({ role: "user", content: text.trim() });

      let systemPrompt = buildSystemPrompt(userName, context);

      // If user has a goal, include it in context
      const savedGoal = getSavedGoal();
      if (savedGoal) {
        systemPrompt += `\n\nEmployee's goal: ${savedGoal.goal}. Why: ${savedGoal.objective}. Timeline: ${savedGoal.timeline}. Success criteria: ${savedGoal.criteria}.`;
      }

      // Task 2 & 3: Search content for recommendations or learning intent
      let contentResults = [];
      if (hasRecommendationIntent(text.trim()) || hasLearningIntent(text.trim())) {
        const searchQuery = savedGoal ? `${text.trim()} ${savedGoal.goal}` : text.trim();
        contentResults = await fetchContentResults(searchQuery);
      }

      if (contentResults.length > 0) {
        systemPrompt += `\n\nAvailable content from the company's learning index (use these real titles, sources, and durations in your recommendations):\n`;
        contentResults.slice(0, 5).forEach((item, i) => {
          systemPrompt += `${i + 1}. "${item.title}" — Source: ${item.source}, Type: ${item.type || 'content'}, Duration: ${item.duration_minutes || '?'} min, Level: ${item.level || 'unknown'}${item.ai_summary ? `, Summary: ${item.ai_summary}` : ''}\n`;
        });
        systemPrompt += `\nReference these actual content items when making recommendations. Include the real title, source, and duration.`;
      } else if (hasLearningIntent(text.trim())) {
        systemPrompt += `\n\nNo indexed content matched this query. Use your own knowledge to help, and note: "I'll search your company's sources when they're connected."`;
      }

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
          system: systemPrompt,
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

        // Background: extract concepts and capture to backend
        extractAndCapture(text.trim(), replyText);
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
    const lowerCtx = text.toLowerCase();
    if (lowerCtx.includes("progress") || lowerCtx.includes("readiness")) {
      onContextChange({ type: "progress" });
    } else if (lowerCtx.includes("learn") || lowerCtx.includes("kubernetes") || lowerCtx.includes("next")) {
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
          concepts: context?.knowledge?.total_concepts || 42,
          gaps: context?.knowledge?.gaps || 3,
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

      {/* Quick actions — hidden during goal onboarding */}
      {messages.length <= 2 && goalStep >= 4 && (
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
