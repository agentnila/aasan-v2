/**
 * Aasan V2 — API Service
 *
 * Single file for all backend communication:
 * - Render.com (Neo4j, Mem0, content, reviews, context)
 * - Claude API (direct from browser)
 * - Perplexity Comet (agentic browser — future)
 * - Perplexity Computer (local agent — future)
 *
 * No Make.com. Everything is direct.
 */

const RENDER_URL = "https://aasan-backend.onrender.com";
const API_SECRET = "aasan-secret-2026";

const headers = {
  "Content-Type": "application/json",
  "X-Aasan-Secret": API_SECRET,
};

// ─────────────────────────────────────────────
// CONTEXT (single call on login)
// ─────────────────────────────────────────────

export async function loadContext(userId) {
  const res = await fetch(`${RENDER_URL}/context/load`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId }),
  });
  return res.json();
}

// ─────────────────────────────────────────────
// KNOWLEDGE GRAPH
// ─────────────────────────────────────────────

export async function getGraphData(userId) {
  const res = await fetch(`${RENDER_URL}/neo4j/get_graph_data`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId }),
  });
  return res.json();
}

export async function getConcepts(userId) {
  const res = await fetch(`${RENDER_URL}/neo4j/get_concepts`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId, limit: 300 }),
  });
  return res.json();
}

// ─────────────────────────────────────────────
// KNOWLEDGE CAPTURE (after learning session)
// ─────────────────────────────────────────────

export async function captureSession({ userId, title, concepts, gaps, summary, duration }) {
  const res = await fetch(`${RENDER_URL}/capture/session`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      session_title: title,
      concepts,
      gaps,
      summary,
      duration_minutes: duration,
    }),
  });
  return res.json();
}

// ─────────────────────────────────────────────
// MEMORY (Mem0)
// ─────────────────────────────────────────────

export async function searchMemory(userId, query) {
  const res = await fetch(`${RENDER_URL}/mem0/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId, query, limit: 10 }),
  });
  return res.json();
}

export async function addMemory(userId, content) {
  const res = await fetch(`${RENDER_URL}/mem0/add`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId, content }),
  });
  return res.json();
}

// ─────────────────────────────────────────────
// CONTENT INDEX
// ─────────────────────────────────────────────

export async function searchContent(query, limit = 10) {
  const res = await fetch(`${RENDER_URL}/content/search`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, limit }),
  });
  return res.json();
}

export async function addContent(contentItem) {
  const res = await fetch(`${RENDER_URL}/content/add`, {
    method: "POST",
    headers,
    body: JSON.stringify(contentItem),
  });
  return res.json();
}

export async function listContent() {
  const res = await fetch(`${RENDER_URL}/content/list`, {
    method: "POST",
    headers,
    body: JSON.stringify({}),
  });
  return res.json();
}

// ─────────────────────────────────────────────
// SPACED REVIEW
// ─────────────────────────────────────────────

export async function getDueReviews(userId) {
  const res = await fetch(`${RENDER_URL}/review/due`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId }),
  });
  return res.json();
}

export async function scheduleReview(userId, conceptName, initialMastery) {
  const res = await fetch(`${RENDER_URL}/review/schedule`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      concept_name: conceptName,
      initial_mastery: initialMastery,
    }),
  });
  return res.json();
}

export async function completeReview(userId, conceptName, rating) {
  const res = await fetch(`${RENDER_URL}/review/complete`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      concept_name: conceptName,
      rating,
    }),
  });
  return res.json();
}

// ─────────────────────────────────────────────
// AASAN AGENT BRIDGE (via Chrome Extension)
// Communicates with Perplexity Comet browser capabilities
// Extension must be installed for agentic features
// ─────────────────────────────────────────────

let bridgeReady = false;

// Listen for bridge ready signal from extension
if (typeof window !== "undefined") {
  window.addEventListener("message", (event) => {
    if (event.data?.source === "aasan-bridge" && event.data?.type === "ready") {
      bridgeReady = true;
      console.log("[Aasan] Agent bridge connected — Peraasan has hands.");
    }
  });
}

export function isAgentConnected() {
  return bridgeReady;
}

// Send a request to the extension and wait for response
function agentRequest(action, payload, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const timeout = setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(new Error("Agent request timed out"));
    }, timeoutMs);

    function handler(event) {
      if (event.data?.source === "aasan-bridge" && event.data?.requestId === requestId) {
        clearTimeout(timeout);
        window.removeEventListener("message", handler);
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      }
    }

    window.addEventListener("message", handler);

    window.postMessage({
      source: "aasan-peraasan",
      action,
      payload,
      requestId,
    }, "*");
  });
}

// Read a URL — Peraasan sends the browser to read a page
export async function agentReadPage(url) {
  if (!bridgeReady) {
    console.log("[Agent] Bridge not connected — cannot read:", url);
    return { status: "not_connected", url };
  }
  return agentRequest("read_page", { url });
}

// Read whatever tab is currently active
export async function agentReadCurrentTab() {
  if (!bridgeReady) return { status: "not_connected" };
  return agentRequest("read_current_tab", {});
}

// Open a URL and read it (keeps tab open for the learner)
export async function agentOpenAndRead(url) {
  if (!bridgeReady) return { status: "not_connected", url };
  return agentRequest("open_and_read", { url });
}

// Get all open tabs
export async function agentGetTabs() {
  if (!bridgeReady) return { status: "not_connected" };
  return agentRequest("get_open_tabs", {});
}

// Search open tabs by keyword
export async function agentSearchTabs(query) {
  if (!bridgeReady) return { status: "not_connected" };
  return agentRequest("search_tabs", { query });
}

// ─────────────────────────────────────────────
// PROJECT MANAGER MODE — Calendar scheduling (V3)
// Solution Arch §14.A. Backend uses stub busy windows until
// Google Calendar OAuth is wired (Phase B).
// ─────────────────────────────────────────────

export async function findSlots({ userId, durationMin = 30, count = 3, rhythm = "default", windowStart, windowEnd, goals } = {}) {
  const res = await fetch(`${RENDER_URL}/calendar/find_slots`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      duration_min: durationMin,
      count,
      rhythm,
      window_start: windowStart,
      window_end: windowEnd,
      goals,
    }),
  });
  return res.json();
}

export async function getGoalBudget(goals, totalMinutesPerWeek = 300) {
  const res = await fetch(`${RENDER_URL}/calendar/goal_budget`, {
    method: "POST",
    headers,
    body: JSON.stringify({ goals, total_minutes_per_week: totalMinutesPerWeek }),
  });
  return res.json();
}

export async function bookSlot({ userId, pathStepId, stepTitle, startAt, endAt, description } = {}) {
  const res = await fetch(`${RENDER_URL}/calendar/book`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      user_id: userId,
      path_step_id: pathStepId,
      step_title: stepTitle,
      start_at: startAt,
      end_at: endAt,
      description,
    }),
  });
  return res.json();
}

export async function rescheduleBlock({ blockId, newStartAt, newEndAt } = {}) {
  const res = await fetch(`${RENDER_URL}/calendar/reschedule`, {
    method: "POST",
    headers,
    body: JSON.stringify({ block_id: blockId, new_start_at: newStartAt, new_end_at: newEndAt }),
  });
  return res.json();
}

export async function cancelBlock(blockId) {
  const res = await fetch(`${RENDER_URL}/calendar/cancel`, {
    method: "POST",
    headers,
    body: JSON.stringify({ block_id: blockId }),
  });
  return res.json();
}

export async function listBlocks(userId, { includePast = false } = {}) {
  const res = await fetch(`${RENDER_URL}/calendar/blocks`, {
    method: "POST",
    headers,
    body: JSON.stringify({ user_id: userId, include_past: includePast }),
  });
  return res.json();
}

// ─────────────────────────────────────────────
// PERPLEXITY COMPUTER (local AI agent)
// Future: communicates with Computer running locally
// ─────────────────────────────────────────────

export async function computerDigest(content) {
  console.log("[Computer] Would digest content");
  return { status: "not_connected" };
}

export async function computerResearch(query, sources) {
  console.log("[Computer] Would research:", query);
  return { status: "not_connected", query };
}

export async function computerMonitor(sourceUrl) {
  console.log("[Computer] Would monitor:", sourceUrl);
  return { status: "not_connected", sourceUrl };
}
