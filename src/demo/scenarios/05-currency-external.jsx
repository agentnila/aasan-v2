import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import ChatScene from '../components/ChatScene'

const SCENES = [
  {
    title: 'A flag Sarah learned in April was deprecated',
    narration: 'Sarah read the Kubernetes Services docs in April (scenario 3 — captured at exposure mastery 0.2). On May 18, K8s 1.31 shipped. The topologyKeys field is now deprecated in favor of topologySpreadConstraints. Sarah doesn\'t know yet.',
    callouts: [
      'No prompt from Sarah. The agent figured this out independently.',
      'External Freshness Watcher = daily background scan. Subscribed to release notes from Kubernetes, AWS, and other tracked projects.',
    ],
  },
  {
    title: '⚡ Currency notification surfaces in Sarah\'s next session',
    narration: 'Sarah opens Aasan. As part of the greeting, the currency flag arrives. Notice the precision: it names the exact field, the exact source, the exact date Sarah learned it, and offers a 3-min refresher.',
    agentic: 'Background pipeline: cron walked Sarah\'s Concept nodes → re-fetched the source → cheap diff (sha256) → substance classifier (Claude) → categorized as "breaking" → mastery decayed by 0.3 → refresher step inserted into path → notification queued for next greeting.',
    callouts: [
      'Substance classifier: cosmetic / clarification / substantive / BREAKING. Only "substantive" or "breaking" trigger a notification.',
      'Cosmetic edits to the same K8s docs in those 4 weeks were silently absorbed — Sarah was never spammed.',
      'Mastery decayed: Sarah\'s knowledge graph honestly reflects "this used to be true; the world changed."',
    ],
  },
  {
    title: 'Sarah does the 3-min refresher',
    narration: 'One tap. The refresher teaches the new syntax (topologySpreadConstraints), connects it to what she already knew (the old approach), and updates her knowledge graph in place.',
    callouts: [
      'After the refresher, mastery on the concept is restored, staleness flag cleared, future spaced reviews use the NEW content.',
      'The Path step is recovered too — the path-engine had marked this step as "stale" (see scenario 8).',
    ],
    takeaway: 'Aasan is the only platform that keeps your knowledge graph TRUE over time. Every other tool teaches you something in April and lets you walk into 2027 still believing it. Currency Watch is the difference between "remember forever" being a promise vs being honest.',
  },
]

export default function Scenario05CurrencyExternal({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  const messages = []

  if (sceneIndex >= 0) {
    messages.push({
      role: 'system',
      content: 'Background · External Freshness Watcher · K8s 1.31 release detected',
    })
    messages.push({
      role: 'peraasan',
      agentBadge: 'BACKGROUND',
      content: `[This message is shown for the demo — in real life, the watcher runs silently. The notification surfaces only at next session.]\n\nDaily scan ran at 03:00 UTC. K8s 1.31 release notes ingested. Cross-referenced against active learners' Concept nodes. Found: 18 employees who learned "Service topology" between April–May. Substance classifier ran on the diff:\n\n→ topologyKeys: DEPRECATED → BREAKING\n→ Other changes: clarification only — silent\n\nQueued: 1 notification per affected employee. Will surface in their next chat session. Mastery decayed by 0.3 on this concept. Path Engine notified to insert refresher steps.`,
    })
  }

  if (sceneIndex >= 1) {
    messages.push({
      role: 'system',
      content: 'Sarah opens Aasan · next session',
    })
    messages.push({
      role: 'peraasan',
      agentBadge: 'CURRENCY',
      content: `Welcome back. Quick heads-up before we pick up your path:`,
      card: {
        type: 'currency',
        concept: 'Kubernetes Service topology',
        source: 'kubernetes.io',
        learnedDate: 'April 22',
        change: 'topologyKeys field is deprecated as of K8s 1.31 (May 18). Replaced by topologySpreadConstraints. Different syntax, same idea, more flexible.',
        severity: 'BREAKING CHANGE',
        refreshDuration: '3 min',
      },
    })
    messages.push({
      role: 'peraasan',
      content: 'Want to handle this first? It\'ll save you debugging time the next time you touch a manifest.',
    })
  }

  if (sceneIndex >= 2) {
    messages.push({
      role: 'employee',
      content: 'Yes, do it',
    })
    messages.push({
      role: 'peraasan',
      content: `Quick refresher.\n\nOLD (deprecated):\n  spec.topologyKeys: [zone, region]\n\nNEW (current):\n  spec.topologySpreadConstraints:\n    - maxSkew: 1\n      topologyKey: zone\n      whenUnsatisfiable: DoNotSchedule\n      labelSelector: ...\n\nThe new approach lets you specify HOW MUCH skew you tolerate per topology dimension — old approach was strict and order-sensitive. More flexible, more verbose.\n\nWant a 1-question check before we move on?`,
    })
    messages.push({
      role: 'peraasan',
      content: 'I\'ve updated your knowledge graph — staleness flag cleared, mastery restored, future reviews will use the new syntax.',
      card: {
        type: 'options',
        options: ['Quick check, then Service Mesh', 'Just continue to Service Mesh'],
      },
    })
  }

  const context = {
    goal: { name: 'Cloud Architect', score: 38, daysLeft: 188, streak: 1, delta: 'recovering' },
    skills: [
      { name: 'Containers', value: 88 },
      { name: 'Kubernetes', value: 65 },
      { name: 'AWS', value: 25 },
      { name: 'Networking', value: 45 },
      { name: 'Security', value: 38 },
    ],
    stats: { concepts: 22, gaps: 5, sessions: 13 },
    activity: [
      { icon: '⚠️', text: '1 concept marked stale: topologyKeys', time: 'just now' },
      { icon: '↻', text: 'Refresher step inserted in path', time: 'just now' },
      { icon: '📊', text: 'Mastery decayed 0.7 → 0.4 on Service topology', time: 'just now' },
    ],
  }

  const contextRefreshed = {
    ...context,
    skills: [
      { name: 'Containers', value: 88 },
      { name: 'Kubernetes', value: 70 },
      { name: 'AWS', value: 25 },
      { name: 'Networking', value: 47 },
      { name: 'Security', value: 38 },
    ],
    activity: [
      { icon: '✓', text: 'Staleness cleared on topologyKeys', time: 'just now' },
      { icon: '📈', text: 'Mastery restored 0.4 → 0.7 (now NEW syntax)', time: 'just now' },
      { icon: '↻', text: 'Future reviews will use topologySpreadConstraints', time: 'just now' },
    ],
  }

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      <ChatScene
        messages={messages}
        context={sceneIndex >= 2 ? contextRefreshed : context}
        inputDraft={sceneIndex === 1 ? 'Yes, do it' : null}
      />
    </DemoFrame>
  )
}
