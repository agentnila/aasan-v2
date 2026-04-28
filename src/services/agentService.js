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
    if (res.status === 404) return _stubFreshnessSingle(sourceUrl)
    return await res.json()
  } catch (err) {
    return _stubFreshnessSingle(sourceUrl, err.message)
  }
}

/**
 * Career Compass — full scan across role market, course launches, vendor certs.
 * Backend orchestrates three Perplexity Computer scrape_pattern jobs and
 * surfaces ranked Career_Signals.
 *
 * @param userId        Optional learner ID (Phase 1 uses a hardcoded subscription)
 * @param targetRole    Optional target role (defaults to "Senior Cloud Architect" for demo)
 * @param maxSignals    Cap (default 10)
 * @returns {
 *   user_id, target_role, scanned_at, signals_count,
 *   signals_by_type: { role_skill_shift, new_course, vendor_cert },
 *   signals: [{ signal_type, title, body, relevance_score, content_ref, detected_at }],
 *   modes: { computer, classifier }
 * }
 *
 * If backend hasn't picked up the new endpoint yet, falls back to JS-side stub
 * with realistic demo signals.
 */
export async function runCareerScan({ userId, targetRole, maxSignals = 10 } = {}) {
  try {
    const res = await fetch(`${RENDER_URL}/career/scan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId,
        target_role: targetRole,
        max_signals: maxSignals,
      }),
    })
    if (res.status === 404) return _stubCareerScan(maxSignals)
    if (!res.ok) return _stubCareerScan(maxSignals, `backend ${res.status}`)
    return await res.json()
  } catch (err) {
    return _stubCareerScan(maxSignals, err.message)
  }
}

/**
 * Currency Watch — full scan over the user's tracked concepts.
 * Backend orchestrates: re-fetch each source, diff, classify, surface verdicts.
 *
 * @param userId        Optional learner ID (Phase 1 uses a hardcoded demo set)
 * @param maxConcepts   Number of concepts to scan (default 5)
 * @returns {
 *   user_id, scanned_at, concepts_scanned, notifications_count,
 *   verdicts: [{ concept_name, source_url, category, summary, should_notify, ... }],
 *   notifications: [...subset where should_notify === true],
 *   modes: { computer: live|stub, classifier: live|stub }
 * }
 *
 * If the backend hasn't been redeployed yet (returns 404), falls back to a
 * client-side stub so the demo loop is observable. Real backend takes over
 * automatically once it's live.
 */
export async function runCurrencyScan({ userId, maxConcepts = 5 } = {}) {
  try {
    const res = await fetch(`${RENDER_URL}/freshness/scan`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, max_concepts: maxConcepts }),
    })
    if (res.status === 404) return _stubCurrencyScan(maxConcepts)
    if (!res.ok) return _stubCurrencyScan(maxConcepts, `backend ${res.status}`)
    return await res.json()
  } catch (err) {
    return _stubCurrencyScan(maxConcepts, err.message)
  }
}

// ─────────────────────────────────────────────
// Client-side stubs — used when the backend hasn't been redeployed yet.
// Same shape as the real responses so callers don't branch on stub vs real.
// ─────────────────────────────────────────────

function _stubFreshnessSingle(sourceUrl, errorMsg = null) {
  return {
    changed: true,
    category: 'breaking',
    summary: `[CLIENT STUB] Backend /freshness/check not yet deployed (${errorMsg || '404'}). When deployed, real Perplexity Computer + Claude classifier will run. Source: ${sourceUrl}`,
    affected_concepts: [],
    confidence: 0.0,
    should_notify: true,
    current_hash: 'stub-' + sourceUrl.slice(-8),
    fetched_at: new Date().toISOString(),
    metadata: { _client_stub: true },
  }
}

function _stubCareerScan(maxSignals = 10, errorMsg = null) {
  const signals = [
    {
      signal_type: 'new_course',
      title: 'LinkedIn Learning: FinOps for Engineers (Foundational)',
      body: '2 hours · directly relevant to the FinOps demand shift detected for your target role.',
      relevance_score: 0.95,
      content_ref: 'stub-linkedin-finops-2026-04',
      detected_at: new Date().toISOString(),
    },
    {
      signal_type: 'role_skill_shift',
      title: 'FinOps now required for Senior Cloud Architect at peer companies',
      body: '47% of postings now require FinOps experience — up from 12% a year ago.',
      relevance_score: 0.92,
      content_ref: 'stub-benchmark-finops',
      detected_at: new Date().toISOString(),
    },
    {
      signal_type: 'new_course',
      title: 'Anthropic launched: Building Production Agentic Systems',
      body: '4 hours · 4.8 rating · matches your AI/ML exploration goal.',
      relevance_score: 0.88,
      content_ref: 'stub-anthropic-agentic',
      detected_at: new Date().toISOString(),
    },
    {
      signal_type: 'role_skill_shift',
      title: "Multi-region resilience moving from 'nice-to-have' to required",
      body: '31% of postings now require multi-region experience (was 8% in Q3 2025).',
      relevance_score: 0.85,
      content_ref: 'stub-benchmark-multiregion',
      detected_at: new Date().toISOString(),
    },
    {
      signal_type: 'vendor_cert',
      title: 'AWS announced new SA Pro path with 3 new modules',
      body: "You've already covered 2 of 3 — third is on cost optimization.",
      relevance_score: 0.83,
      content_ref: 'stub-aws-sapro',
      detected_at: new Date().toISOString(),
    },
  ].slice(0, maxSignals)

  return {
    user_id: 'demo-user',
    target_role: 'Senior Cloud Architect',
    scanned_at: new Date().toISOString(),
    signals_count: signals.length,
    signals_by_type: {
      role_skill_shift: signals.filter((s) => s.signal_type === 'role_skill_shift').length,
      new_course: signals.filter((s) => s.signal_type === 'new_course').length,
      vendor_cert: signals.filter((s) => s.signal_type === 'vendor_cert').length,
    },
    signals,
    modes: { computer: 'client_stub', classifier: 'client_stub' },
    _client_stub_reason: errorMsg || 'Backend /career/scan not yet deployed',
  }
}

function _stubCurrencyScan(maxConcepts = 5, errorMsg = null) {
  const stubVerdicts = [
    {
      concept_name: 'Kubernetes Service topology',
      source_url: 'https://kubernetes.io/docs/concepts/services-networking/service/',
      captured_at: '2026-04-22',
      domain: 'Cloud Infrastructure',
      changed: true,
      category: 'breaking',
      summary: 'topologyKeys field deprecated in K8s 1.31 — replaced by topologySpreadConstraints',
      should_notify: true,
      current_hash: 'stub-k8s-svc',
      fetched_at: new Date().toISOString(),
    },
    {
      concept_name: 'AWS Lambda runtimes',
      source_url: 'https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html',
      captured_at: '2026-04-15',
      domain: 'Cloud Infrastructure',
      changed: true,
      category: 'substantive',
      summary: 'nodejs16.x runtime entered deprecation; nodejs20.x is now the default',
      should_notify: true,
      current_hash: 'stub-lambda',
      fetched_at: new Date().toISOString(),
    },
    {
      concept_name: 'React Server Components',
      source_url: 'https://react.dev/reference/rsc/server-components',
      captured_at: '2026-04-10',
      domain: 'Frontend',
      changed: true,
      category: 'clarification',
      summary: 'Documentation reworded for clarity; no semantic change',
      should_notify: false,
      current_hash: 'stub-rsc',
      fetched_at: new Date().toISOString(),
    },
  ].slice(0, maxConcepts)

  return {
    user_id: 'demo-user',
    scanned_at: new Date().toISOString(),
    concepts_scanned: stubVerdicts.length,
    notifications_count: stubVerdicts.filter((v) => v.should_notify).length,
    verdicts: stubVerdicts,
    notifications: stubVerdicts.filter((v) => v.should_notify),
    modes: {
      computer: 'client_stub',
      classifier: 'client_stub',
    },
    _client_stub_reason: errorMsg || 'Backend /freshness/scan not yet deployed',
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
  runCurrencyScan,
  runCareerScan,
}

export default agent
