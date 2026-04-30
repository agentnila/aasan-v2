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
// Resume Module — V3 living service record + tailored resume
// ─────────────────────────────────────────────

export async function addJournalEntry(userId, rawInput, structured) {
  try {
    const res = await fetch(`${RENDER_URL}/resume/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId || 'demo-user', raw_input: rawInput, structured }),
    })
    if (res.status === 404) return _stubAddJournal(rawInput)
    return await res.json()
  } catch (err) {
    return _stubAddJournal(rawInput, err.message)
  }
}

export async function shareEntry(userId, entryId, peerEmails) {
  try {
    const res = await fetch(`${RENDER_URL}/resume/share`, {
      method: 'POST', headers,
      body: JSON.stringify({ user_id: userId, entry_id: entryId, peer_emails: peerEmails || [] }),
    })
    return await res.json()
  } catch (err) { return { error: err.message } }
}

export async function requestEndorsements(userId, entryId, peerEmails) {
  try {
    const res = await fetch(`${RENDER_URL}/resume/request_endorsements`, {
      method: 'POST', headers,
      body: JSON.stringify({ user_id: userId, entry_id: entryId, peer_emails: peerEmails || [] }),
    })
    return await res.json()
  } catch (err) { return { error: err.message } }
}

export async function declineEndorsement({ authorUserId, entryId, endorserEmail, reason = '' }) {
  try {
    const res = await fetch(`${RENDER_URL}/resume/decline_endorsement`, {
      method: 'POST', headers,
      body: JSON.stringify({
        author_user_id: authorUserId, entry_id: entryId,
        endorser_email: endorserEmail, reason,
      }),
    })
    return await res.json()
  } catch (err) { return { error: err.message } }
}

export async function endorseEntry({ authorUserId, entryId, endorserEmail, endorserName, endorserRole, comment }) {
  try {
    const res = await fetch(`${RENDER_URL}/resume/endorse`, {
      method: 'POST', headers,
      body: JSON.stringify({
        author_user_id: authorUserId, entry_id: entryId,
        endorser_email: endorserEmail, endorser_name: endorserName,
        endorser_role: endorserRole, comment,
      }),
    })
    return await res.json()
  } catch (err) { return { error: err.message } }
}

export async function getResumeFeed(userEmail, { limit = 25 } = {}) {
  try {
    const res = await fetch(`${RENDER_URL}/resume/feed`, {
      method: 'POST', headers,
      body: JSON.stringify({ user_email: userEmail, limit }),
    })
    return await res.json()
  } catch (err) { return { error: err.message, events: [], count: 0 } }
}

export async function listJournal(userId, limit = 50) {
  try {
    const res = await fetch(`${RENDER_URL}/resume/journal`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId || 'demo-user', limit }),
    })
    if (res.status === 404) return _stubJournal()
    return await res.json()
  } catch (err) {
    return _stubJournal(err.message)
  }
}

export async function tailorResume(userId, jobUrl, jobDescription) {
  try {
    const res = await fetch(`${RENDER_URL}/resume/tailor`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId || 'demo-user', job_url: jobUrl, job_description: jobDescription }),
    })
    if (res.status === 404) return _stubTailorResume(jobUrl)
    return await res.json()
  } catch (err) {
    return _stubTailorResume(jobUrl, err.message)
  }
}

function _stubAddJournal(rawInput, errorMsg = null) {
  return {
    entry: {
      entry_id: `j-${Date.now()}`,
      title: rawInput.split('. ')[0]?.slice(0, 100) || 'Journal entry',
      category: 'project',
      description: rawInput,
      outcomes: [],
      technologies: [],
      stakeholders: [],
      transferable_skills: [],
      raw_input: rawInput,
      captured_at: new Date().toISOString(),
      _stub: true,
    },
    journal_size: 9,
    modes: { classifier: 'client_stub' },
    _client_stub_reason: errorMsg || 'Backend /resume/add not yet deployed',
  }
}

function _stubJournal(errorMsg = null) {
  return {
    user_id: 'demo-user',
    entry_count: 8,
    by_category: { project: 2, mentoring: 1, crisis_response: 1, presentation: 1, customer: 1, tech_adoption: 1, documentation: 1 },
    entries: [],
    _client_stub_reason: errorMsg || 'Backend /resume/journal not yet deployed',
  }
}

function _stubTailorResume(jobUrl, errorMsg = null) {
  return {
    job_url: jobUrl,
    job_title: 'Senior SRE',
    job_company: 'Datadog',
    match_score: 0.78,
    tailored_summary: 'Senior Software Engineer with 4 years building production cloud infrastructure. Track record includes shipping multi-region failover, leading critical incident response, and adopting platform technologies. Strong cross-team coordination and mentoring experience. Match for this role: 78%.',
    highlighted_projects: [
      { title: 'Led incident response for the Stripe API outage', date: '2026-03-12', category: 'crisis_response', match_score: 0.85, match_reason: 'Skill overlap: Crisis leadership · Category: crisis_response (often valued for SRE roles)', outcomes: ['Restored service in 47 min (SLA: 60 min)', 'Identified root cause: rate limiter misconfiguration', 'Post-mortem actions adopted org-wide'], technologies: ['PagerDuty', 'Datadog', 'AWS'] },
      { title: 'Shipped multi-region failover for primary API', date: '2026-04-15', category: 'project', match_score: 0.72, match_reason: 'Tech overlap: AWS Route 53, Aurora Global · Skill overlap: Production operations', outcomes: ['Reduced RTO from 30 min → 4 min', 'Zero downtime during rollout'], technologies: ['AWS Route 53', 'Aurora Global', 'Terraform', 'Kubernetes'] },
      { title: 'Wrote on-call escalation runbook', date: '2025-12-15', category: 'documentation', match_score: 0.68, match_reason: 'Skill overlap: Process design · Operational thinking', outcomes: ['Used by team of 8 every on-call shift', 'Cut Sev-1 escalation time 12→4 min'], technologies: ['Confluence', 'PagerDuty'] },
    ],
    key_outcomes_to_emphasize: ['Restored service in 47 min (SLA: 60 min)', 'Reduced RTO from 30 min → 4 min', 'Cut Sev-1 escalation time 12→4 min', 'Saved ~$12K/month within 3 months', 'Onboarding time-to-productive 8→4 weeks'],
    relevant_tech: ['AWS', 'Datadog', 'Kubernetes', 'PagerDuty', 'Terraform', 'Aurora Global', 'AWS Route 53'],
    transferable_skills: ['Crisis leadership', 'Production operations', 'Cross-team coordination', 'Mentoring', 'Process design'],
    gaps_vs_job: [
      'Direct people management experience (you have led projects but not had direct reports)',
      'Public conference talks (no entries in journal show this)',
      'Open-source contributions (none in journal — start one to fix this gap)',
    ],
    experiences_to_emphasize: [
      'Lead with the Stripe outage incident response — strongest credibility moment for senior SRE roles',
      'Quantify the cost-reporting tool savings ($12K/month) — recruiters skim for $ figures',
    ],
    modes: { computer: 'client_stub', classifier: 'client_stub' },
    _client_stub_reason: errorMsg || 'Backend /resume/tailor not yet deployed',
  }
}

// ─────────────────────────────────────────────
// Career Compass · Stay Ahead — V3 mobility intelligence
// ─────────────────────────────────────────────

export async function runStayAhead(userId, profile) {
  try {
    const res = await fetch(`${RENDER_URL}/career/stay_ahead`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId || 'demo-user', profile }),
    })
    if (res.status === 404) return _stubStayAhead()
    if (!res.ok) return _stubStayAhead(`backend ${res.status}`)
    return await res.json()
  } catch (err) {
    return _stubStayAhead(err.message)
  }
}

export async function runScenarioSimulation(userId, scenarios, profile) {
  try {
    const res = await fetch(`${RENDER_URL}/career/simulate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId || 'demo-user', scenarios, profile }),
    })
    if (res.status === 404) return _stubSimulation()
    if (!res.ok) return _stubSimulation(`backend ${res.status}`)
    return await res.json()
  } catch (err) {
    return _stubSimulation(err.message)
  }
}

function _stubStayAhead(errorMsg = null) {
  return {
    ai_resilience: {
      // V3 headline metric (higher = better)
      score: 68,
      score_max: 100,
      band: 'Stable',
      band_tone: 'green',
      band_verdict: 'Well-positioned. A few specific moves keep you ahead of the curve.',
      trend: {
        history: [
          { quarter: 'Q2 2025', score: 58 },
          { quarter: 'Q3 2025', score: 62 },
          { quarter: 'Q4 2025', score: 64 },
          { quarter: 'Q1 2026', score: 66 },
          { quarter: 'Q2 2026', score: 68 },
        ],
        direction: 'rising',
        change_last_quarter: 2,
        narrative: 'Your AI-Resilience score went 66 → 68 this quarter — your move into agent-aware architecture work is paying off. Sustained trajectory: +10 over 4 quarters.',
      },
      components: [
        { label: 'Skill demand growth', score: 78, note: 'Cloud Architect demand +18% YoY in your market' },
        { label: 'AI task replacement risk', score: 62, note: 'Some routine tasks (boilerplate, Terraform drafting) automatable today' },
        { label: 'Up-the-stack mobility', score: 72, note: 'Architectural judgment + customer-facing decisions are AI-resistant' },
        { label: 'Geographic + financial mobility', score: 65, note: 'Remote-friendly stack; comp at 75th percentile' },
        { label: 'Cross-skill versatility', score: 70, note: 'K8s + AWS + Linux + Python + presentation skills' },
      ],
      peer_benchmark: {
        role: 'Senior SWE (cloud track)',
        peer_avg_score: 58,
        your_score: 68,
        delta_vs_peers: 10,
        percentile: 73,
      },
      vulnerability_score: 0.32,
      vulnerability_level: 'low-medium',
      headline: 'Your Senior SWE → Cloud Architect track is RELATIVELY AI-resilient. Architectural judgment, organizational alignment, and customer-facing decisions are the parts AI is NOT taking over. Cloud Architects are needed to DESIGN AI infrastructure — demand growing 22% YoY.',
      ai_replaced_today: [
        'Boilerplate code generation (use AI; don\'t define yourself by it)',
        'Initial Terraform / CloudFormation drafting',
        'Routine log analysis + first-pass incident triage',
      ],
      ai_amplified_skills: [
        'System design judgment (AI proposes, you decide tradeoffs)',
        'Customer-facing architecture decisions',
        'Cross-team alignment + organizational politics',
        'Incident command under pressure',
      ],
      up_the_stack_moves: [
        { title: 'Build agentic systems yourself', what: 'Be the engineer who ships AI agents — not the one replaced by them', concrete_step: 'Build a personal AI agent this quarter' },
        { title: 'Become the AI infra architect', what: 'Cloud Architects who specialize in AI workloads are in extreme demand', concrete_step: 'Add AI infrastructure patterns to your path' },
        { title: 'Agent supervision / evaluation', what: 'Designing evals for AI agents is a net-new role category', concrete_step: "Take Anthropic's agentic systems course" },
      ],
      ai_resilient_pivots: [
        { role: 'AI Infrastructure Architect', rationale: 'AI is a tailwind. Demand +35% YoY. Cloud expertise translates directly.' },
        { role: 'Agentic Systems Engineer', rationale: 'Net-new role; supply thin. You design what AI does.' },
        { role: 'Developer Advocate (AI tools)', rationale: 'AI tool companies need humans who can teach + show. AI-immune 5+ years.' },
      ],
      what_to_avoid: [
        'Roles defined by routine code generation',
        'Pure DevOps automation specialist',
        'QA-only roles',
      ],
    },
    market_risk: {
      level: 'manageable', tone: 'amber',
      signal: 'Trajectory toward Cloud Architect well-timed (+18% YoY). BUT AWS-only specialists shrinking 6% YoY — diversify within 18 months.',
      data_points: ['Multi-cloud now required at 47% (was 22%)', 'FinOps required at 47% (was 12%)', '~38K tech layoffs last 90 days; cloud roles relatively insulated'],
    },
    best_fit_roles: [
      { title: 'Senior Cloud Engineer', company: 'Stripe', salary_range: '$220K-$260K', match_score: 0.92, match_reason: 'AWS + K8s + Linux + Python match 9 of 10 requirements.', why_apply: 'Strong infra culture, growing platform team.' },
      { title: 'Senior SRE', company: 'Datadog', salary_range: '$240K-$290K', match_score: 0.89, match_reason: 'Strong overlap with observability work.', why_apply: 'Datadog values K8s ops experience.' },
    ],
    stretch_roles: [
      { title: 'Staff Cloud Architect', company: 'Anthropic', salary_range: '$280K-$340K', match_score: 0.78, match_reason: 'Tech match strong. Gaps: FinOps + multi-region production.', path_to_ready: '6 weeks if FinOps mini-path + 1 multi-region project.' },
    ],
    pivot_options: [
      { title: 'Solutions Engineer', company: 'AWS', salary_range: '$200K-$280K (base + variable)', match_score: 0.74, transferable_skills: ['Cloud expertise', 'Customer-facing comfort'], why_pivot: 'Higher upside via variable comp. Path to consulting/VC later.' },
      { title: 'Developer Advocate', company: 'HashiCorp', salary_range: '$180K-$240K', match_score: 0.68, transferable_skills: ['Cloud expertise', 'Content interest'], why_pivot: 'Public visibility builds personal brand. Path into VC/founding.' },
    ],
    hands_on_experiences: [
      { title: 'Adjunct lecturer in Cloud Architecture', kind: 'teaching', adds_to_resume: 'Teaching credibility · networking · pivot to dev-advocacy', how_to_get_it: 'Email CS dept chair at nearby university. 2-4 hrs/week.', fit_score: 0.88 },
      { title: 'Build a personal AI agent project (ship to GitHub)', kind: 'side_project', adds_to_resume: 'AI/ML adjacency · public artifact · matches MLOps exploration', how_to_get_it: 'Weekend project. Use Claude API + a real personal pain. 3-5 weekends.', fit_score: 0.92 },
      { title: 'Open-source contribution to KubeVirt or Cilium', kind: 'open_source', adds_to_resume: 'Deep K8s credibility · visible to hiring managers', how_to_get_it: 'Pick "good first issue" tagged in repo. 4-6 weekends to first PR.', fit_score: 0.85 },
      { title: 'Volunteer board advisor for a non-profit', kind: 'advisor', adds_to_resume: 'Leadership · governance · cross-functional · resume diversity', how_to_get_it: 'VolunteerMatch / BoardSource / local non-profits needing infra help.', fit_score: 0.76 },
    ],
    summary: 'Three roles you could land today, two stretch within reach, three viable pivots. Biggest leverage: a hands-on AI project + adjunct lecturing.',
    modes: { computer: 'client_stub', classifier: 'client_stub' },
    _client_stub_reason: errorMsg || 'Backend /career/stay_ahead not yet deployed',
  }
}

function _stubSimulation(errorMsg = null) {
  return {
    scenario_count: 3,
    projections: [
      { id: 'stay-current', name: 'Stay the course — Cloud Architect at TechCorp', headline: 'Lowest-risk path. 70% chance of Cloud Architect by month 12.', effort_hours_per_week: 4, horizon_months: 18,
        outcomes: [{ milestone_at_months: 12, mid_outcome: { role: 'Cloud Architect (Staff)', comp: '$240K-$260K', probability: 0.7, note: 'Goal achieved on plan' }, low_outcome: { role: 'Senior SWE', comp: '$200K', probability: 0.1, note: 'Promo delayed' }, high_outcome: { role: 'Staff + leading migration', comp: '$260K-$285K', probability: 0.2, note: 'Org-level project leadership' } }],
        required_experiences: ['Continue Cloud Architect path (already 46%)', 'Lead one cross-team migration'],
        risk_markers: ['AWS-only specialization narrows long-term mobility', 'Internal promotion timing depends on cycle'],
      },
      { id: 'pivot-aws-se', name: 'Pivot — Solutions Engineer at AWS', headline: 'High variable upside (+30-50%). ~50% chance of OTE in year 1.', effort_hours_per_week: 6, horizon_months: 18,
        outcomes: [{ milestone_at_months: 12, mid_outcome: { role: 'AWS SE on-target', comp: '$280K-$320K total', probability: 0.55, note: 'Hit quota' }, low_outcome: { role: 'AWS SE ramping', comp: '$220K total', probability: 0.2, note: 'Quota miss in Y1' }, high_outcome: { role: "AWS SE — President's Club tier", comp: '$340K-$400K total', probability: 0.25, note: 'Top-quartile rep' } }],
        required_experiences: ['Customer-facing pitch practice', 'AWS SA Pro cert (~6 weeks)', '1-2 large customer war stories'],
        risk_markers: ['Variable comp = year-1 ramp risk (~40% miss)', 'Reduces technical depth — hard to return to deep IC', 'AWS hiring tightening if cloud spend softens'],
      },
      { id: 'stretch-anthropic', name: 'Stretch — Staff Cloud Architect at Anthropic', headline: 'Highest ceiling (+$60-100K + meaningful equity). 35% chance at 12 months.', effort_hours_per_week: 10, horizon_months: 12,
        outcomes: [{ milestone_at_months: 12, mid_outcome: { role: 'Staff Cloud Architect at Anthropic', comp: '$320K-$360K + equity', probability: 0.35, note: 'Goal achieved' }, low_outcome: { role: 'Staff Cloud Architect at peer co (Snowflake/Stripe)', comp: '$280K-$310K', probability: 0.3, note: 'Anthropic miss; peer landed' }, high_outcome: { role: 'Staff+ at Anthropic + conference talks', comp: '$340K + equity', probability: 0.1, note: 'Public profile builds' } }],
        required_experiences: ['Finish FinOps mini-path (6 weeks)', 'Multi-region project on GitHub + blog', 'OSS contribution in agentic systems', '1-2 conference talks'],
        risk_markers: ['10 hrs/week is sustainable 6 months but burnout risk', 'Anthropic + AI cos hire selectively', 'Equity-heavy depends on growth-stage outcomes'],
      },
    ],
    comparison_summary: 'Stay-the-course is lowest-risk with strong upside (70% Cloud Architect by 18mo). Pivot to AWS SE is high variable upside but trades technical depth. Stretch to Anthropic is highest ceiling — only 35% chance, but the 35% includes +$40-60K and stronger long-term resume.',
    modes: { engine: 'client_stub' },
    _client_stub_reason: errorMsg || 'Backend /career/simulate not yet deployed',
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

export async function registerSME(employeeId, profile) {
  if (!employeeId) return { error: 'employee_id required' }
  if (!profile?.name?.trim()) return { error: 'profile.name required' }
  if (!profile?.subjects?.length) return { error: 'profile.subjects required' }
  try {
    const res = await fetch(`${RENDER_URL}/sme/register`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ employee_id: employeeId, profile }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

export async function getSMEProfile(employeeId) {
  if (!employeeId) return { error: 'employee_id required' }
  try {
    const res = await fetch(`${RENDER_URL}/sme/profile`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ employee_id: employeeId }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

export async function listSMEs({ activeOnly = true, limit = 100 } = {}) {
  try {
    const res = await fetch(`${RENDER_URL}/sme/list`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ active_only: activeOnly, limit }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message, smes: [], count: 0 }
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

export async function findSMESlots(smeId, learnerId, { durationMin = 30, count = 3, windowDays = 14 } = {}) {
  if (!smeId) return { error: 'sme_id required', slots: [] }
  try {
    const res = await fetch(`${RENDER_URL}/sme/find_slots`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sme_id: smeId,
        learner_id: learnerId || 'demo-user',
        duration_min: durationMin,
        count,
        window_days: windowDays,
      }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message, slots: [] }
  }
}

// ─────────────────────────────────────────────
// RBAC + ADMIN CONSOLE — Internal Pilot Pack
// ─────────────────────────────────────────────

export async function getMe(userId) {
  try {
    const res = await fetch(`${RENDER_URL}/admin/me`, {
      method: 'POST',
      headers: { ...headers, 'X-Aasan-User': userId || 'demo-user' },
      body: JSON.stringify({ user_id: userId || 'demo-user' }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message, role: 'learner', is_admin: false, modules: [] }
  }
}

export async function adminListUsers(actorUserId, { filterRole, search, limit = 200 } = {}) {
  try {
    const res = await fetch(`${RENDER_URL}/admin/users/list`, {
      method: 'POST',
      headers: { ...headers, 'X-Aasan-User': actorUserId || 'demo-user' },
      body: JSON.stringify({ filter_role: filterRole, search, limit }),
    })
    if (res.status === 403) return { error: 'forbidden', users: [], count: 0 }
    return await res.json()
  } catch (err) {
    return { error: err.message, users: [], count: 0 }
  }
}

export async function adminSetRole(actorUserId, targetUserId, role) {
  try {
    const res = await fetch(`${RENDER_URL}/admin/users/set_role`, {
      method: 'POST',
      headers: { ...headers, 'X-Aasan-User': actorUserId || 'demo-user' },
      body: JSON.stringify({ target_user_id: targetUserId, role }),
    })
    return await res.json()
  } catch (err) { return { error: err.message } }
}

export async function adminUpdateUser(actorUserId, targetUserId, fields) {
  try {
    const res = await fetch(`${RENDER_URL}/admin/users/update`, {
      method: 'POST',
      headers: { ...headers, 'X-Aasan-User': actorUserId || 'demo-user' },
      body: JSON.stringify({ target_user_id: targetUserId, fields }),
    })
    return await res.json()
  } catch (err) { return { error: err.message } }
}

// ─────────────────────────────────────────────
// TEAM MODULE — manager view of team learning progress
// ─────────────────────────────────────────────

export async function listTeam(managerId) {
  try {
    const res = await fetch(`${RENDER_URL}/team/list`, {
      method: 'POST', headers,
      body: JSON.stringify({ manager_id: managerId || 'demo-user' }),
    })
    return await res.json()
  } catch (err) { return { error: err.message, team: [], count: 0 } }
}

export async function getTeamMember(managerId, memberId) {
  if (!memberId) return { error: 'member_id required' }
  try {
    const res = await fetch(`${RENDER_URL}/team/member`, {
      method: 'POST', headers,
      body: JSON.stringify({ manager_id: managerId || 'demo-user', member_id: memberId }),
    })
    return await res.json()
  } catch (err) { return { error: err.message } }
}

export async function sendTeamKudos({ managerId, reportId, message }) {
  try {
    const res = await fetch(`${RENDER_URL}/team/kudos`, {
      method: 'POST', headers,
      body: JSON.stringify({ manager_id: managerId || 'demo-user', report_id: reportId, message }),
    })
    return await res.json()
  } catch (err) { return { error: err.message } }
}

export async function listMyBookings(userId, { includePast = false } = {}) {
  if (!userId) return { error: 'user_id required', as_learner: [], as_sme: [], total: 0 }
  try {
    const res = await fetch(`${RENDER_URL}/sme/my_bookings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, include_past: includePast }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message, as_learner: [], as_sme: [], total: 0 }
  }
}

export async function bookSMESlot({ smeId, learnerId, topic, startAt, endAt }) {
  if (!smeId || !startAt || !endAt) return { error: 'sme_id, startAt, endAt required' }
  try {
    const res = await fetch(`${RENDER_URL}/sme/book`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        sme_id: smeId,
        learner_id: learnerId || 'demo-user',
        topic,
        start_at: startAt,
        end_at: endAt,
      }),
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

// ─────────────────────────────────────────────
// LIBRARY MODULE — content discovery + coverage
// ─────────────────────────────────────────────

export async function getContentCoverage() {
  try {
    const res = await fetch(`${RENDER_URL}/content/coverage`, {
      method: 'POST',
      headers,
      body: JSON.stringify({}),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message, total: 0, by_source: {}, by_skill: {}, by_difficulty: {}, recent: [] }
  }
}

export async function semanticSearch(query, { topK = 8 } = {}) {
  if (!query?.trim?.()) return { matches: [], query: '' }
  try {
    const res = await fetch(`${RENDER_URL}/content/semantic_search`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, top_k: topK }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message, matches: [], query }
  }
}

export async function runDriveIndex({ limit = 25, targetUserId } = {}) {
  try {
    const res = await fetch(`${RENDER_URL}/drive/index`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ limit, target_user_id: targetUserId }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

export async function markStepDone(userId, goalId, stepId, { mastery, durationMinutes } = {}) {
  try {
    const res = await fetch(`${RENDER_URL}/path/mark_done`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: userId, goal_id: goalId, step_id: stepId,
        mastery, duration_minutes: durationMinutes,
      }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

export async function skipStep(userId, goalId, stepId, reason = '') {
  try {
    const res = await fetch(`${RENDER_URL}/path/skip_step`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, goal_id: goalId, step_id: stepId, reason }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

export async function reorderStep(userId, goalId, stepId, newOrder) {
  try {
    const res = await fetch(`${RENDER_URL}/path/reorder`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, goal_id: goalId, step_id: stepId, new_order: newOrder }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

export async function listScheduleBlocks(userId, { includePast = false } = {}) {
  try {
    const res = await fetch(`${RENDER_URL}/calendar/blocks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, include_past: includePast }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message, blocks: [] }
  }
}

export async function createGoal(userId, goal) {
  if (!userId) return { error: 'user_id required' }
  if (!goal?.name?.trim?.()) return { error: 'goal.name required' }
  try {
    const res = await fetch(`${RENDER_URL}/goal/create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ user_id: userId, goal }),
    })
    return await res.json()
  } catch (err) {
    return { error: err.message }
  }
}

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
  findSMESlots,
  bookSMESlot,
  listMyBookings,
  listTeam,
  getTeamMember,
  sendTeamKudos,
  getMe,
  adminListUsers,
  adminSetRole,
  adminUpdateUser,
  registerSME,
  getSMEProfile,
  listSMEs,
  createGoal,
  markStepDone,
  skipStep,
  reorderStep,
  listScheduleBlocks,
  getContentCoverage,
  semanticSearch,
  runDriveIndex,
  bookSME,
  // Career Compass family
  runStayAhead,
  runScenarioSimulation,
  // Resume module
  addJournalEntry,
  listJournal,
  tailorResume,
  shareEntry,
  requestEndorsements,
  endorseEntry,
  declineEndorsement,
  getResumeFeed,
}

export default agent
