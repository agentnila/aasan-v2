import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import ChatScene from '../components/ChatScene'

const SCENES = [
  {
    title: 'Sarah returns 4 days later',
    narration: 'Real life happened. Sarah was heads-down on a sprint. Today she opens Aasan again. Notice the time-skip indicator at the top of the chat.',
    callouts: [
      'Other tools would either dump the old session as if no time passed, or force her through "what were we working on?" friction.',
      'Aasan handles the gap intelligently.',
    ],
  },
  {
    title: '⚡ Cross-session named handoff',
    narration: 'One greeting. It bundles three things into a single moment: where she was on her path, what review is due, AND what changed in the world while she was away. No goal re-confirmation. No friction.',
    agentic: 'WHILE SARAH WAS AWAY, the agent didn\'t sleep. It watched K8s release notes (currency watcher), tracked the team\'s Confluence runbook for substantive edits, and queued her review schedule. When she came back, all of it was waiting in ONE bundled greeting — not 4 separate notifications.',
    callouts: [
      'The "While you were away" section is the killer feature — proves Peraasan was watching FOR her.',
      'Three options as buttons — picking "continue" is the path of least resistance.',
      'Same-day return (under 3h) wouldn\'t even show this greeting — silent restore.',
    ],
    takeaway: 'Aasan turns a 4-day gap into zero friction. Most learning tools penalize you for not showing up daily. Aasan rewards you by handling everything that happened while you were away.',
  },
  {
    title: 'Sarah picks "refresher first"',
    narration: 'She makes one tap. Peraasan starts the K8s 1.31 topology refresher (covered in detail in Scenario 5). After that, she\'ll roll into Service Mesh — exactly where she\'d be if she\'d never left.',
    callouts: [
      'Notice: she didn\'t have to re-state her goal, re-state her path, or hunt for what she was doing. Peraasan kept the thread.',
    ],
  },
]

export default function Scenario04Continuity({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  const messages = []

  if (sceneIndex >= 0) {
    messages.push({
      role: 'system',
      content: 'Last session: April 22 · 4 days ago',
    })
  }

  if (sceneIndex >= 1) {
    messages.push({
      role: 'peraasan',
      agentBadge: 'CONTINUITY',
      content: 'Welcome back. Quick catch-up so you can pick up where you left off:',
      card: {
        type: 'continuity',
        lastSession: 'Tuesday, April 22 · 4 days ago',
        lastTopic: 'Kubernetes Services & Networking (mastery 0.7)',
        pathStep: 'Service Mesh with Istio (~30 min)',
        bundle: [
          { icon: '🔁', tone: 'review', text: '1 review due: ClusterIP vs NodePort (~2 min)' },
          { icon: '⚠️', tone: 'currency', text: 'K8s 1.31 dropped this week — the topologyKeys field you learned is deprecated. 3-min refresher available.' },
          { icon: '📄', tone: 'doc', text: 'Team incident runbook updated yesterday — Sev-1 escalation path changed. You read this on Apr 22.' },
        ],
      },
    })
    messages.push({
      role: 'peraasan',
      content: 'Pick one and I\'ll handle the rest:',
      card: {
        type: 'options',
        options: ['Continue path (Service Mesh)', 'Refresher first (K8s 1.31)', 'Review first (~2 min)', 'Something else'],
      },
    })
  }

  if (sceneIndex >= 2) {
    messages.push({
      role: 'employee',
      content: 'Refresher first',
    })
    messages.push({
      role: 'peraasan',
      content: 'Smart — the topology change is small but it\'ll bite you next time you write a manifest. 3 minutes. After this we\'ll roll into Service Mesh.\n\n(See scenario 5 for the full refresher flow.)',
    })
  }

  const context = {
    goal: { name: 'Cloud Architect', score: 38, daysLeft: 188, streak: 0, delta: 'paused 4d' },
    skills: [
      { name: 'Containers', value: 88 },
      { name: 'Kubernetes', value: 70 },
      { name: 'AWS', value: 25 },
      { name: 'Networking', value: 50 },
      { name: 'Security', value: 38 },
    ],
    stats: { concepts: 22, gaps: 5, sessions: 13 },
    pathSummary: { current: 'Service Mesh with Istio', next: 'AWS Core Services', percent: 50, stepsDone: 6, totalSteps: 12 },
    activity: [
      { icon: '⚠️', text: 'K8s 1.31 release detected', time: '6h ago' },
      { icon: '📄', text: 'Team runbook substantively edited', time: '1d ago' },
      { icon: '🔁', text: 'Review due: ClusterIP vs NodePort', time: 'today' },
    ],
  }

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      <ChatScene
        messages={messages}
        context={context}
        inputDraft={sceneIndex === 1 ? 'Refresher first' : null}
      />
    </DemoFrame>
  )
}
