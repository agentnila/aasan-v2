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
// PERPLEXITY COMET (agentic browser)
// Future: communicates with Comet running on the same machine
// ─────────────────────────────────────────────

export async function cometBrowse(url) {
  // TODO: Call Perplexity Comet's agent API
  // For now, return a placeholder
  console.log("[Comet] Would navigate to:", url);
  return { status: "not_connected", url };
}

export async function cometRead(url) {
  // TODO: Call Comet to read page content
  console.log("[Comet] Would read:", url);
  return { status: "not_connected", url };
}

export async function cometEnroll(courseUrl) {
  // TODO: Call Comet to navigate enrollment flow
  console.log("[Comet] Would enroll at:", courseUrl);
  return { status: "not_connected", courseUrl };
}

// ─────────────────────────────────────────────
// PERPLEXITY COMPUTER (local AI agent)
// Future: communicates with Computer running locally
// ─────────────────────────────────────────────

export async function computerDigest(content) {
  // TODO: Call Perplexity Computer to summarise/extract
  console.log("[Computer] Would digest content");
  return { status: "not_connected" };
}

export async function computerResearch(query, sources) {
  // TODO: Call Computer for multi-step research
  console.log("[Computer] Would research:", query);
  return { status: "not_connected", query };
}

export async function computerMonitor(sourceUrl) {
  // TODO: Call Computer to watch for new content
  console.log("[Computer] Would monitor:", sourceUrl);
  return { status: "not_connected", sourceUrl };
}
