import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import ChatScene from '../components/ChatScene'

const SCENES = [
  {
    title: 'Switch perspective: Raj is Sarah\'s manager',
    narration: 'Raj — engineering manager, 8 direct reports — opens Aasan. Same chat interface as Sarah, different context. Manager mode is just a different lens; no separate admin tool.',
    callouts: [
      'Same product, same UI, different persona — managers learn the tool by using it as learners.',
      'No "manager dashboard" to hunt through. He just asks Peraasan in plain language.',
    ],
  },
  {
    title: 'Raj asks "how\'s my team?"',
    narration: 'Peraasan returns team readiness — per-person, with trend deltas, gap notes, and actionable hints. Aggregated, never personal-history-revealing.',
    callouts: [
      'Privacy: Raj sees readiness scores and gap categories, NOT individual conversations or detailed knowledge graphs.',
      'Trend deltas: ↑ rising, ↓ struggling — surfaces who needs attention.',
    ],
  },
  {
    title: '⚡ Raj assigns in one sentence — Peraasan does the rest',
    narration: 'Raj types "Assign the AWS path to James." Peraasan creates a personalized path for James based on James\'s existing knowledge graph, queues a notification, and confirms — all in one response.',
    agentic: 'Behind the scenes: Peraasan looked up James\'s knowledge graph, marked steps James already knows as "refresher available", inserted the right content from the index, generated an estimated time-to-complete, queued the assignment in Airtable, and queued a Notification for James\'s next session — all from one English sentence.',
    callouts: [
      'No 15-step assignment workflow. No spreadsheet. No "fill out this form" friction.',
      'Personalized to JAMES — not "everyone gets the same 47-module course."',
      'Raj sees confirmation immediately; James sees it in his next session greeting.',
    ],
  },
  {
    title: 'Raj contributes content — Peraasan indexes + tags + surfaces',
    narration: 'Raj has an incident management slide deck. He shares the link in chat. Peraasan indexes it, tags it (Incident Management, SRE, Production), and will surface it to teammates when they\'re learning related topics.',
    agentic: 'Manager expertise — the most valuable knowledge in the company — is usually trapped in Slack messages and meetings. Aasan turns one shared link into a permanent, contextually-surfaced learning asset for the whole team. Raj didn\'t become an instructional designer. He just shared a link.',
    callouts: [
      'The deck is now indexed in the Content Index, available to the recommendation engine for any teammate learning incident management.',
      'Auto-surfaces — Raj doesn\'t have to remember to share it again.',
    ],
    takeaway: 'Manager + Aasan = scalable mentorship. Raj directs in one sentence; Peraasan does the assignment, the personalization, the indexing, the tagging, and the contextual surfacing. The manager focuses on judgment; the agent handles the workflow.',
  },
]

export default function Scenario09Manager({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  const messages = []

  if (sceneIndex >= 0) {
    messages.push({
      role: 'system',
      content: 'Raj Patel · Engineering Manager · 8 direct reports',
    })
    messages.push({
      role: 'peraasan',
      content: `Good morning, Raj. Anything specific to look at, or quick team status?`,
    })
  }

  if (sceneIndex >= 1) {
    messages.push({
      role: 'manager',
      content: 'How\'s my team doing on Cloud skills?',
    })
    messages.push({
      role: 'peraasan',
      content: 'Cloud Architect readiness across your team:',
      card: {
        type: 'team-readiness',
        teamName: 'Platform Engineering · 8 members',
        members: [
          { initials: 'SC', name: 'Sarah Chen', score: 48, trend: 'up', delta: '+10', note: 'Strong momentum, on Service Mesh' },
          { initials: 'JP', name: 'James Park', score: 18, trend: 'down', delta: '-2', note: 'Stalled — 0 sessions in 9 days' },
          { initials: 'EM', name: 'Emily Mendez', score: 62, trend: 'up', delta: '+4', note: 'Ahead of plan' },
          { initials: 'DK', name: 'David Kim', score: 71, trend: 'up', delta: '+2', note: 'Could mentor others' },
          { initials: 'AS', name: 'Aisha Singh', score: 35, trend: '–', delta: '0', note: 'On parental leave' },
          { initials: '+3', name: '3 more team members', score: 42, trend: 'up', delta: '+3', note: 'Avg of remaining team' },
        ],
      },
    })
    messages.push({
      role: 'peraasan',
      content: `Two things worth your attention:\n\n• James hasn\'t opened Aasan in 9 days — he was struggling with Container Basics last time. Want me to send a low-pressure ping?\n• David is at 71 readiness — he\'s a candidate to mentor newer team members on K8s.`,
    })
  }

  if (sceneIndex >= 2) {
    messages.push({
      role: 'manager',
      content: 'Assign the AWS path to James. He\'s starting on the migration team next week.',
    })
    messages.push({
      role: 'peraasan',
      agentBadge: 'ASSIGNED',
      content: `Done.`,
      card: {
        type: 'assignment-confirm',
        to: 'James Park',
        what: 'AWS Solutions Architect path (personalized — 9 of 14 steps based on what James already knows)',
        etaSummary: 'Personalized: I marked Linux + Container basics as "likely known — refresher available" since James has them in his graph. Estimated completion: 6 weeks at 3 hrs/week. He\'ll see this in his next Aasan session greeting.',
      },
    })
    messages.push({
      role: 'peraasan',
      content: 'Want me to notify him now via Slack, or let him discover it next time he opens Aasan?',
      card: {
        type: 'options',
        options: ['Notify on Slack now', 'Let him discover it', 'Schedule for Monday morning'],
      },
    })
  }

  if (sceneIndex >= 3) {
    messages.push({
      role: 'manager',
      content: 'Also — share this incident management deck with the whole team: https://docs.google.com/presentation/d/1AbC...',
    })
    messages.push({
      role: 'peraasan',
      agentBadge: 'INDEXED',
      content: `Reading the deck via the Agent Bridge…`,
    })
    messages.push({
      role: 'peraasan',
      content: 'Indexed. Tagged it: Incident Management, SRE, Production Operations, On-call.\n\nI\'ll surface it to your team in two ways:\n• When any teammate is learning about incident response or production operations\n• In the next Friday team digest as "Raj recommends"\n\nWant to assign it as required reading for new hires (e.g., when James completes his AWS path)?',
      card: {
        type: 'options',
        options: ['Yes, assign for new hires', 'Just surface contextually', 'Pin to team home'],
      },
    })
  }

  const context = {
    overrideTitle: 'Raj\'s context',
    goal: { name: 'Team: Cloud-ready by Q3', score: 44, daysLeft: 92, streak: 0 },
  }

  // Build a Manager-mode override for the right rail
  const managerContext = {
    overrideTitle: 'Team Readiness Snapshot',
    overrideContent: (
      <div className="space-y-3">
        <div>
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1">TEAM AVG · CLOUD ARCHITECT</p>
          <div className="flex items-baseline gap-1">
            <span className="font-serif text-2xl font-bold text-navy">44</span>
            <span className="text-xs text-gray-400">/100</span>
            <span className="ml-auto text-[10px] text-green-600 font-mono">↑3 this wk</span>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1.5">BY ROLE</p>
          <div className="space-y-1.5">
            {[
              { label: 'Senior SWE (3)', value: 52 },
              { label: 'Mid SWE (3)', value: 38 },
              { label: 'Junior SWE (2)', value: 28 },
            ].map((r) => (
              <div key={r.label}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] text-text-primary">{r.label}</span>
                  <span className="text-[10px] text-gray-400 font-mono">{r.value}</span>
                </div>
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-navy" style={{ width: `${r.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1.5">TEAM GAPS</p>
          <ul className="text-[11px] text-text-primary space-y-1">
            <li>• Service Mesh — 6 of 8 weak</li>
            <li>• AWS IAM — 5 of 8 weak</li>
            <li>• Observability — 4 of 8 weak</li>
          </ul>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1.5">CONTRIBUTIONS THIS MONTH</p>
          <p className="text-[11px] text-text-primary">2 docs shared by you</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Surfaced 47 times to teammates</p>
        </div>
      </div>
    ),
  }

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      <ChatScene
        messages={messages}
        context={managerContext}
        inputDraft={
          sceneIndex === 0
            ? "How's my team doing on Cloud skills?"
            : sceneIndex === 1
            ? "Assign the AWS path to James. He's starting on the migration team next week."
            : sceneIndex === 2
            ? 'Also — share this incident management deck with the whole team: https://docs.google.com/...'
            : null
        }
      />
    </DemoFrame>
  )
}
