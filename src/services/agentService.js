/**
 * Aasan V3 — Agent Service Abstraction
 *
 * The single React-side surface for ALL agentic capabilities.
 * Two execution paths, hidden behind one interface:
 *
 *   1. In-browser actions  → Peraasan Agent Bridge (Chrome extension)
 *      e.g. read a URL the learner is looking at; manage tabs; light form-fills
 *
 *   2. Server-side actions → Render backend → Perplexity Computer
 *      e.g. daily currency scans, weekly market scrapes, course enrollment,
 *      content pre-digestion, deep multi-step research
 *
 * The rest of the app should NEVER import api.js directly for agentic work.
 * Always go through this file. If we swap Perplexity Computer for Claude
 * computer use / Browserbase / Stagehand later, only this file changes.
 *
 * STATUS — V3 Phase 1 (Apr 27, 2026):
 *   • Bridge (in-browser): ✅ Live in Chrome
 *   • Computer (server-side): 🟡 Backend wired with stub mode (PERPLEXITY_API_KEY
 *     unset). Real calls activate the moment the env var is set in Render.
 */

import {
  // Existing Bridge functions — re-exported through this module so callers
  // never need to know which underlying tool is doing the work.
  agentReadPage as bridgeReadPage,
  agentReadCurrentTab as bridgeReadCurrentTab,
  agentOpenAndRead as bridgeOpenAndRead,
  agentGetTabs as bridgeGetTabs,
  agentSearchTabs as bridgeSearchTabs,
  isAgentConnected as bridgeIsConnected,
} from './api'

const RENDER_URL = 'https://aasan-backend.onrender.com'
const API_SECRET = 'aasan-secret-2026'

const headers = {
  'Content-Type': 'application/json',
  'X-Aasan-Secret': API_SECRET,
}

// ─────────────────────────────────────────────
// Status — both layers
// ─────────────────────────────────────────────

let _serverStatus = null

/**
 * Reports whether the in-browser Bridge is connected.
 * Synchronous — based on extension presence detection.
 */
export function isBridgeConnected() {
  return bridgeIsConnected()
}

/**
 * Reports server-side agentic status (Perplexity Computer + Claude).
 * Caches result per page load. Returns:
 *   { perplexity_computer: { live, mode }, claude: { live, mode } }
 * `mode` is 'live' (real API) or 'stub' (mock responses).
 */
export async function getServerAgentStatus({ refresh = false } = {}) {
  if (_serverStatus && !refresh) return _serverStatus
  try {
    const res = await fetch(`${RENDER_URL}/agent/status`, { headers })
    _serverStatus = await res.json()
    return _serverStatus
  } catch (err) {
    return {
      perplexity_computer: { live: false, mode: 'unreachable' },
      claude: { live: false, mode: 'unreachable' },
      error: err.message,
    }
  }
}

// ─────────────────────────────────────────────
// In-browser actions (via Bridge)
// Re-exported with consistent naming so callers say `agent.readPage(...)`
// and don't need to know it's the Bridge underneath.
// ─────────────────────────────────────────────

export const inBrowser = {
  isConnected: bridgeIsConnected,
  readPage: bridgeReadPage,
  readCurrentTab: bridgeReadCurrentTab,
  openAndRead: bridgeOpenAndRead,
  getTabs: bridgeGetTabs,
  searchTabs: bridgeSearchTabs,
}

// ─────────────────────────────────────────────
// Server-side actions (via Render → Perplexity Computer)
// Each function maps to a /agent or capability endpoint on the backend.
// Stubs gracefully if backend or Computer credentials are missing.
// ─────────────────────────────────────────────

/**
 * Generic Perplexity Computer pass-through. Use the typed helpers below
 * when possible; this is for ad-hoc / new task kinds.
 */
async function runComputer(task, timeoutMs = 60000) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${RENDER_URL}/agent/computer_run`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ task, timeout_s: Math.floor(timeoutMs / 1000) }),
      signal: controller.signal,
    })
    clearTimeout(timer)
    return await res.json()
  } catch (err) {
    return { status: 'error', error: { code: 'client_error', message: err.message } }
  }
}

/**
 * Fetch a URL via Perplexity Computer (server-side).
 * Use this when the page should be read OUTSIDE the learner's browser context
 * (e.g., scheduled scans, background research). For pages the learner is
 * actively looking at, prefer `inBrowser.readPage()` via the Bridge.
 */
export async function fetchUrlServerSide(url) {
  return runComputer({
    kind: 'fetch_url',
    input: { url },
    constraints: { timeout_s: 30, max_chars: 8000 },
  })
}

/**
 * Watch whether a URL has changed since a known content hash.
 * Returns a quick yes/no with the new content hash.
 */
export async function watchUrlChanges(url, baselineHash) {
  return runComputer({
    kind: 'watch_changes',
    input: { url, baseline_hash: baselineHash },
    constraints: { timeout_s: 30 },
  })
}

/**
 * Multi-source web scrape — used by Career Compass market scan.
 */
export async function scrapePattern(query, sources, maxResults = 50) {
  return runComputer(
    {
      kind: 'scrape_pattern',
      input: { query, sources, max_results: maxResults },
      constraints: { timeout_s: 300, max_pages: maxResults },
    },
    300000,
  )
}

/**
 * Deep multi-step web research.
 */
export async function research(question, depth = 'medium') {
  return runComputer(
    {
      kind: 'research',
      input: { question, depth },
      constraints: { timeout_s: 180 },
    },
    180000,
  )
}

/**
 * Drive a course-enrollment flow on the learner's behalf.
 */
export async function enrollInCourse(courseUrl, credentialsRef) {
  return runComputer(
    {
      kind: 'enroll',
      input: { course_url: courseUrl, credentials_ref: credentialsRef },
      constraints: { timeout_s: 120 },
    },
    120000,
  )
}

// ─────────────────────────────────────────────
// Capability-level helpers
// (one rung up from Computer primitives — these match V3 capability surfaces)
// ─────────────────────────────────────────────

/**
 * Currency Watch — check whether a tracked source has materially changed.
 * Calls /freshness/check which: re-fetches via Computer + classifies via Claude.
 *
 * @param sourceUrl     The URL of the source to re-check
 * @param baselineText  The previously cached main text (for diffing)
 * @param baselineHash  Optional sha256 of baseline_text — short-circuits if matches current
 * @param context       Optional concept/learner context for the classifier
 * @returns { changed, category, summary, should_notify, current_text, current_hash, ... }
 */
export async function checkFreshness({ sourceUrl, baselineText, baselineHash, context }) {
  try {
    const res = await fetch(`${RENDER_URL}/freshness/check`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        source_url: sourceUrl,
        baseline_text: baselineText || '',
        baseline_hash: baselineHash || '',
        context: context || {},
      }),
    })
    return await res.json()
  } catch (err) {
    return {
      changed: false,
      category: 'error',
      summary: `Could not reach freshness backend: ${err.message}`,
      should_notify: false,
    }
  }
}

// ─────────────────────────────────────────────
// Default export — namespaced for ergonomic imports
// ─────────────────────────────────────────────

const agent = {
  isBridgeConnected,
  getServerAgentStatus,
  inBrowser,
  // Computer primitives
  fetchUrlServerSide,
  watchUrlChanges,
  scrapePattern,
  research,
  enrollInCourse,
  // Capability helpers
  checkFreshness,
}

export default agent
