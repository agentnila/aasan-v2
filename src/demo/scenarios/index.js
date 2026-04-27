import Scenario01Onboarding from './01-onboarding'
import Scenario02DailyLearning from './02-daily-learning'
import Scenario03AgentBridge from './03-agent-bridge'
import Scenario04Continuity from './04-continuity'
import Scenario05CurrencyExternal from './05-currency-external'
import Scenario06DocChange from './06-doc-change'
import Scenario07GoalsDashboard from './07-goals-dashboard'
import Scenario08PathAdjustment from './08-path-adjustment'
import Scenario09Manager from './09-manager'
import Scenario10ELW from './10-elw'

export const scenarios = [
  {
    id: 1,
    slug: 'onboarding',
    title: 'First-day onboarding — set a goal in conversation',
    persona: 'Sarah · new employee',
    summary: 'Day one. Peraasan greets Sarah and captures her goal in 4 conversational steps. The path materializes the moment her goal is set.',
    agentic: 'Path generated and personalized in real time — no forms, no setup wizards.',
    component: Scenario01Onboarding,
  },
  {
    id: 2,
    slug: 'daily-learning',
    title: 'Daily learning — chat is the product',
    persona: 'Sarah · day 12',
    summary: 'Sarah opens Aasan, gets a greeting with status, knocks out a quick review, and starts the next step. Knowledge is captured live in the right rail as she learns.',
    agentic: 'Watch the right rail — Peraasan captures concepts AS Sarah learns. No "save" button.',
    component: Scenario02DailyLearning,
  },
  {
    id: 3,
    slug: 'agent-bridge',
    title: 'Agent Bridge — read any web page on the learner\'s behalf',
    persona: 'Sarah',
    summary: 'Sarah pastes a URL into chat. Peraasan opens it via the Agent Bridge Chrome extension on Perplexity Comet, reads it, summarizes it, and persists to 3 layers — all automatically.',
    agentic: 'THE marquee agentic moment. Peraasan does the reading. Mastery captured at 0.2 — exposure, not active learning.',
    component: Scenario03AgentBridge,
  },
  {
    id: 4,
    slug: 'session-continuity',
    title: 'Session continuity — pick up where you left off',
    persona: 'Sarah · returns 4 days later',
    summary: 'Sarah comes back after a gap. Peraasan opens with a cross-session named handoff: last topic, next path step, what changed while she was away. One greeting, three options.',
    agentic: 'While Sarah was away, Peraasan was watching the world for her — currency flag and review surface together in one bundled greeting.',
    component: Scenario04Continuity,
  },
  {
    id: 5,
    slug: 'knowledge-currency',
    title: 'Knowledge currency — the world changed; your knowledge graph caught it',
    persona: 'Sarah',
    summary: 'K8s 1.31 deprecated a flag Sarah learned in April. Peraasan\'s background watcher detected it, classified the change as "breaking", and surfaces a 3-min refresher — never spam, only substantive.',
    agentic: 'Background watcher running daily. Reads release notes. Substance classifier (cosmetic / clarification / substantive / breaking). Only "breaking" gets surfaced.',
    component: Scenario05CurrencyExternal,
  },
  {
    id: 6,
    slug: 'doc-change',
    title: 'Internal doc change — substantive only, never cosmetic',
    persona: 'Sarah',
    summary: 'The team\'s incident runbook was edited. Peraasan classified the change — typos and link fixes were silently absorbed; a procedural change to Sev-1 escalation was surfaced. Only what matters.',
    agentic: 'Continuous monitoring of every internal doc Sarah has touched. Substance classifier prevents notification spam.',
    component: Scenario06DocChange,
  },
  {
    id: 7,
    slug: 'goals-dashboard',
    title: 'Goals dashboard — multiple goals, each with its own live path',
    persona: 'Sarah',
    summary: 'Sarah clicks "🎯 My Goals" in the left nav. Three active goals — career, compliance, exploration — each with status, progress, and recent path adjustments by the engine.',
    agentic: 'Every goal\'s path was last adjusted by Peraasan. Recent adjustments are right on the card — full transparency.',
    component: Scenario07GoalsDashboard,
  },
  {
    id: 8,
    slug: 'path-adjustment',
    title: 'Live path adjustment — engine inserts a step on its own',
    persona: 'Sarah',
    summary: 'Sarah finishes a step. The Path Engine detects an mTLS gap she didn\'t know she had, and inserts a new 10-min step before AWS Core Services. Peraasan tells her what changed and why.',
    agentic: 'After every session: engine evaluates path against new mastery + detected gaps + Currency flags + manager assignments. Never silently — always with reasoning.',
    component: Scenario08PathAdjustment,
  },
  {
    id: 9,
    slug: 'manager',
    title: 'Manager view — assign in one sentence, see what was actually retained',
    persona: 'Raj · engineering manager',
    summary: 'Raj asks "how\'s my team?" → readiness cards. Then "Assign AWS path to James" — done. Then shares a doc — Peraasan indexes, tags, surfaces it to teammates when relevant.',
    agentic: 'Manager directs in plain language. Peraasan does the assignment workflow, indexing, tagging, and contextual surfacing — all in the background.',
    component: Scenario09Manager,
  },
  {
    id: 10,
    slug: 'enterprise-warehouse',
    title: 'Enterprise Learning Warehouse — "are we ready for our strategic plan?"',
    persona: 'Maria · CLO / L&D Director',
    summary: 'Maria asks the question no platform can answer today: "Are we ready to ship the multi-region platform by Q4?" Aasan answers with a workforce capability map, gap analysis, and prioritized interventions (train / hire / contract / mentor pair).',
    agentic: 'Mirrors the individual side at org scale. Workforce readiness rolls up from every employee\'s verified knowledge graph — the only authoritative answer that exists.',
    component: Scenario10ELW,
  },
]
