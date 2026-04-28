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

// ─────────────────────────────────────────────
// SME Marketplace — V3
// Internal directory + external curated marketplace + booking
// ─────────────────────────────────────────────

export async function findSMEs(topic, learnerId, limit = 5) {
  if (!topic) return { error: 'topic required' }
  try {
    const res = await fetch(`${RENDER_URL}/sme/find`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ topic, learner_id: learnerId || 'demo-user', limit }),
    })
    if (res.status === 404) return _stubFindSMEs(topic)
    if (!res.ok) return _stubFindSMEs(topic, `backend ${res.status}`)
    return await res.json()
  } catch (err) {
    return _stubFindSMEs(topic, err.message)
  }
}

export async function bookSME(smeId, learnerId, topic, slot) {
  try {
    const res = await fetch(`${RENDER_URL}/sme/book`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ sme_id: smeId, learner_id: learnerId || 'demo-user', topic, slot }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

function _stubFindSMEs(topic, errorMsg = null) {
  const matches = [
    {
      sme_id: 'external-1', sme_type: 'external', name: 'Maya Patel',
      role: 'Independent Service Mesh Consultant',
      match_topic: topic, match_mastery: 0.95, match_score: 0.931,
      rate_per_30min: 40, rate_currency: 'usd', languages: ['en', 'hi'],
      sessions_completed: 87, kudos_score: 4.9, next_available: 'in ~90 min',
      bio: 'Former Google SRE, now independent consultant.',
    },
    {
      sme_id: 'internal-1', sme_type: 'internal', name: 'David Kim',
      role: 'Senior Site Reliability Engineer', team: 'Platform Engineering',
      match_topic: topic, match_mastery: 0.87, match_score: 0.875,
      recent_activity_days_ago: 2,
      rate_per_30min: 0, languages: ['en'],
      sessions_completed: 12, kudos_score: 4.9, next_available: 'Thu 14:00 PT',
    },
    {
      sme_id: 'external-2', sme_type: 'external', name: 'Carlos Rivera',
      role: 'Kubernetes & Istio Expert',
      match_topic: topic, match_mastery: 0.88, match_score: 0.845,
      rate_per_30min: 60, rate_currency: 'usd', languages: ['en', 'es'],
      sessions_completed: 134, kudos_score: 4.8, next_available: 'tomorrow 10:00 CT',
      bio: 'CKA + CKAD certified trainer.',
    },
    {
      sme_id: 'external-3', sme_type: 'external', name: 'Alex Park',
      role: 'K8s contributor (free / kudos-only)',
      match_topic: topic, match_mastery: 0.82, match_score: 0.771,
      rate_per_30min: 0, languages: ['en', 'ko'],
      sessions_completed: 28, kudos_score: 4.7, next_available: 'next Sat 10:00 BST',
      bio: 'K8s SIG-network contributor.',
    },
    {
      sme_id: 'internal-2', sme_type: 'internal', name: 'Emily Mendez',
      role: 'Staff Platform Engineer', team: 'Platform Engineering',
      match_topic: topic, match_mastery: 0.82, match_score: 0.664,
      recent_activity_days_ago: 7,
      rate_per_30min: 0, languages: ['en', 'es'],
      sessions_completed: 6, kudos_score: 4.8, next_available: 'Mon 10:00 ET',
    },
  ]
  return {
    topic,
    matched_at: new Date().toISOString(),
    match_count: matches.length,
    matches,
    matches_by_type: { internal: 2, external: 3 },
    _client_stub_reason: errorMsg || 'Backend /sme/find not yet deployed',
  }
}

// ─────────────────────────────────────────────
// Path Engine — V3 Live Persistent Learning Paths
// ─────────────────────────────────────────────

export async function listGoals(userId) {
  try {
    const res = await fetch(`${RENDER_URL}/goal/list`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId || 'demo-user' }),
    })
    if (res.status === 404) return _stubGoalList()
    if (!res.ok) return _stubGoalList(`backend ${res.status}`)
    return await res.json()
  } catch (err) {
    return _stubGoalList(err.message)
  }
}

export async function getPath(userId, goalId) {
  try {
    const res = await fetch(`${RENDER_URL}/path/get`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId || 'demo-user', goal_id: goalId }),
    })
    if (!res.ok) return { error: `backend ${res.status}` }
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

export async function recomputePath(userId, goalId, trigger = 'session_complete', triggerPayload = {}) {
  try {
    const res = await fetch(`${RENDER_URL}/path/recompute`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId || 'demo-user',
        goal_id: goalId,
        trigger,
        trigger_payload: triggerPayload,
      }),
    })
    if (res.status === 404) return _stubRecompute(goalId, trigger)
    if (!res.ok) return _stubRecompute(goalId, trigger, `backend ${res.status}`)
    return await res.json()
  } catch (err) {
    return _stubRecompute(goalId, trigger, err.message)
  }
}

export async function insertStepManual(userId, goalId, step) {
  try {
    const res = await fetch(`${RENDER_URL}/path/insert_step`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId || 'demo-user', goal_id: goalId, step }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

function _stubGoalList(errorMsg = null) {
  return {
    user_id: 'demo-user',
    goal_count: 3,
    goals: [
      {
        id: 'cloud-architect', name: 'Become a Cloud Architect', priority: 'primary',
        objective: "Lead our team's cloud migration, get promoted to Staff Engineer",
        timeline: 'Q4 2026', days_left: 192, readiness: 48, delta: '+10 this wk',
        path_summary: { progress_pct: 46, current_step_title: 'Service Mesh with Istio', total_steps: 13, completed_steps: 5, last_recompute_reason: 'Inserted topology refresher — K8s 1.31 deprecation', recent_adjustments: [] },
      },
      {
        id: 'compliance', name: 'Data Privacy Compliance 2026', priority: 'assigned',
        objective: 'Annual mandatory compliance', timeline: 'June 30, 2026', days_left: 64, readiness: 35, delta: '+15 this wk',
        path_summary: { progress_pct: 33, current_step_title: 'PII handling for engineers', total_steps: 3, completed_steps: 1, last_recompute_reason: 'Pre-marked known steps from prior year', recent_adjustments: [] },
      },
      {
        id: 'mlops', name: 'Learn about MLOps', priority: 'exploration',
        objective: 'Curious; might bridge to next role', timeline: 'No deadline', days_left: null, readiness: 12, delta: 'new',
        path_summary: { progress_pct: 25, current_step_title: 'Model serving fundamentals', total_steps: 5, completed_steps: 1, last_recompute_reason: 'Inserted Feature Stores — matched curiosity', recent_adjustments: [] },
      },
    ],
    _client_stub_reason: errorMsg || 'Backend /goal/list not yet deployed',
  }
}

function _stubRecompute(goalId, trigger, errorMsg = null) {
  return {
    goal_id: goalId,
    goal_name: 'Become a Cloud Architect',
    trigger,
    diff: {
      summary: "Marked Service Mesh done. Detected mTLS gap during the session. Inserted 'mTLS Quickstart (10 min)' before AWS Core Services.",
      added: [{ id: 'step-6a', order: 6.5, title: 'mTLS Quickstart', step_type: 'gap_closure', status: 'active', estimated_minutes: 10, inserted_by: 'engine', inserted_reason: 'auto: gap detected during Service Mesh session' }],
      modified: [{ id: 'step-6', status: 'done', mastery_at_completion: 0.7 }],
      removed: [],
      reordered: [],
    },
    path_after: { progress_pct: 46, current_step_id: 'step-6a', current_step_title: 'mTLS Quickstart', total_steps: 14 },
    recomputed_at: new Date().toISOString(),
    mode: 'client_stub',
    _client_stub_reason: errorMsg || 'Backend /path/recompute not yet deployed',
  }
}

/**
 * Pre-digest a long URL — Perplexity Computer reads it deeply, Claude extracts
 * a structured 5-concept digest + TL;DR + suggested next step.
 *
 * @param url             The URL to pre-digest
 * @param learnerContext  Optional { goal, current_path_step, etc. } for tailoring
 * @returns {
 *   url, title, source_domain,
 *   tldr, key_concepts: [{ name, body, importance }, ...],
 *   reading_time_saved_minutes,
 *   suggested_next_step,
 *   modes: { computer, classifier },
 *   fetched_at,
 * }
 */
export async function predigestDoc({ url, learnerContext } = {}) {
  if (!url) return { error: "url is required" }
  try {
    const res = await fetch(`${RENDER_URL}/agent/predigest`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url, learner_context: learnerContext || {} }),
    })
    if (res.status === 404) return _stubPredigest(url)
    if (!res.ok) return _stubPredigest(url, `backend ${res.status}`)
    return await res.json()
  } catch (err) {
    return _stubPredigest(url, err.message)
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

function _stubPredigest(url, errorMsg = null) {
  return {
    url,
    title: '[Client stub] Pre-digested document',
    source_domain: url.replace(/^https?:\/\//, '').split('/')[0],
    tldr: `Backend /agent/predigest not yet deployed (${errorMsg || '404'}). When deployed, Perplexity Computer reads ${url} deeply and Claude returns a structured 5-concept digest.`,
    key_concepts: [
      { name: 'Concept 1', body: 'First key idea from the source.', importance: 0.9 },
      { name: 'Concept 2', body: 'Second key idea.', importance: 0.8 },
      { name: 'Concept 3', body: 'Third key idea.', importance: 0.7 },
    ],
    reading_time_saved_minutes: 15,
    suggested_next_step: 'Want a 5-min deep-dive on the first concept?',
    modes: { computer: 'client_stub', classifier: 'client_stub' },
    fetched_at: new Date().toISOString(),
    _client_stub_reason: errorMsg || 'Backend /agent/predigest not yet deployed',
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
  predigestDoc,
  // Path Engine
  listGoals,
  getPath,
  recomputePath,
  insertStepManual,
  // SME Marketplace
  findSMEs,
  bookSME,
}

export default agent
