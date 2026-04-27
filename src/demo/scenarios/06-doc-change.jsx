import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import ChatScene from '../components/ChatScene'

const SCENES = [
  {
    title: 'The team\'s incident runbook gets edited 40 times a month',
    narration: 'Most edits are typos, formatting, broken-link fixes. They don\'t matter. Sarah has read this runbook — Aasan tracks every internal doc she\'s touched.',
    callouts: [
      'Internal Doc Change Monitor watches every doc in Sarah\'s personal "touched" set.',
      'It re-fetches periodically (hourly for hot docs, daily otherwise).',
    ],
  },
  {
    title: '⚡ Most edits are silently absorbed',
    narration: 'In the last 2 weeks, the runbook had 11 edits. The substance classifier ran on each. 9 were cosmetic (typos, link fixes, image swap). 1 was a clarification (same meaning, better wording). 1 was substantive — and that\'s the one that surfaces.',
    agentic: 'The hardest design rule: NEVER spam the learner with cosmetic noise. The substance classifier (Claude with both versions) categorizes every change as cosmetic / clarification / substantive / breaking. Only the last two trigger a notification. The other 9 edits never bothered Sarah.',
    callouts: [
      'This is the "trust" rule — if Aasan starts spamming on every formatting change, learners mute it.',
      'The classifier is conservative: when in doubt, treat as cosmetic.',
    ],
  },
  {
    title: 'The substantive change surfaces',
    narration: 'The change that matters: Sev-1 escalation now goes to the on-call SRE (was the EM). This is a procedural change with operational consequences. Sarah relied on this exact section of the runbook on April 27.',
    callouts: [
      'Notice the precision — "you read this on Apr 27" — Aasan knows when she touched this doc and which section was relevant.',
      'The notification quotes the specific change, not the raw diff.',
      'Italic line: "Cosmetic edits to this doc were silently absorbed. This one mattered." — that\'s how trust is built.',
    ],
    takeaway: 'Aasan is the only platform that watches your internal docs FOR you. Every other tool lets a quietly-edited runbook bite you in production. Aasan tells you what changed, in plain language, and only when it matters.',
  },
]

export default function Scenario06DocChange({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  const messages = []

  if (sceneIndex >= 0) {
    messages.push({
      role: 'system',
      content: 'Background · Internal Doc Change Monitor · Confluence',
    })
    messages.push({
      role: 'peraasan',
      agentBadge: 'BACKGROUND',
      content: `[For the demo: this is what the watcher sees in the background. Sarah is not interrupted yet.]\n\nDoc: TechCorp Engineering / Incident Response Runbook v3.2\nLast known sha256: a4f9...\nCurrent sha256: c81e...  ← changed\n\nDiff size: 240 chars added, 380 removed. Substance classifier running…\n\nClassifier output:\n  category: SUBSTANTIVE\n  summary: "Sev-1 escalation contact changed from EM to on-call SRE"\n  affected_concepts: ["incident escalation procedure", "Sev-1 response"]\n  severity: medium\n\nAction: queue notification for Sarah Chen (read this doc on 2026-04-27, KNOWS the affected concepts).`,
    })
  }

  if (sceneIndex >= 1) {
    messages.push({
      role: 'system',
      content: 'Past 14 days · 11 edits to this doc · 10 silently absorbed',
    })
    messages.push({
      role: 'peraasan',
      agentBadge: 'BACKGROUND',
      content: `Examples of edits Sarah was NOT bothered by:\n• "incdent" → "incident" (cosmetic)\n• Image asset swapped to higher resolution (cosmetic)\n• Bullet style changed from "-" to "•" (cosmetic)\n• Wording "promptly" → "within 5 minutes" (clarification — same meaning, more specific)\n• "See appendix B" → "See appendix C" after appendix renumber (cosmetic)\n• ... and 5 more cosmetic edits\n\nNone of these triggered a notification. Sarah\'s attention is precious.`,
    })
  }

  if (sceneIndex >= 2) {
    messages.push({
      role: 'system',
      content: 'Sarah opens Aasan · this notification appears in her greeting',
    })
    messages.push({
      role: 'peraasan',
      agentBadge: 'DOC CHANGE',
      content: 'Heads-up: the team\'s incident runbook was updated. The substantive change matters because you relied on this section on Apr 27:',
      card: {
        type: 'doc-change',
        docTitle: 'Incident Response Runbook v3.2 → v3.3',
        lastRead: 'April 27',
        severity: 'SUBSTANTIVE',
        change: 'Sev-1 escalation now goes to the on-call SRE (was the EM). The on-call rotation is in PagerDuty under "Platform — SRE primary".',
      },
    })
    messages.push({
      role: 'peraasan',
      content: 'Want me to update the relevant concept in your knowledge graph and queue a 1-min recall check for next week?',
      card: {
        type: 'options',
        options: ['Yes, update + queue review', 'Just update silently', 'Show me the full diff'],
      },
    })
  }

  const context = {
    goal: { name: 'Cloud Architect', score: 42, daysLeft: 185, streak: 2, delta: '↑4 this wk' },
    skills: [
      { name: 'Containers', value: 88 },
      { name: 'Kubernetes', value: 72 },
      { name: 'AWS', value: 28 },
      { name: 'Networking', value: 47 },
      { name: 'Security', value: 38 },
      { name: 'Operations', value: 55 },
    ],
    stats: { concepts: 24, gaps: 5, sessions: 14 },
    activity: [
      { icon: '📄', text: '11 doc edits in the past 14 days', time: 'monitor' },
      { icon: '🔇', text: '10 cosmetic edits silently absorbed', time: 'past 14d' },
      { icon: '⚠️', text: '1 substantive change surfaced', time: 'just now' },
    ],
  }

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      <ChatScene messages={messages} context={context} />
    </DemoFrame>
  )
}
