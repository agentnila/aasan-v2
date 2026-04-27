import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import ChatScene from '../components/ChatScene'

const SCENES = [
  {
    title: 'Sarah opens Aasan on day 12',
    narration: 'No homepage. No dashboard. The chat opens directly with a status-aware greeting. One look and Sarah knows where she stands and what to do.',
    callouts: [
      'Greeting bundles: readiness delta, momentum signal, one due review, next path step.',
      'No "what would you like to do today?" — Peraasan already proposes 2 paths, 1 click each.',
    ],
  },
  {
    title: 'Sarah picks "review first"',
    narration: 'A quick spaced-review card appears in chat — a real recall question, not a click-through. Sarah answers correctly, mastery is confirmed, next review scheduled.',
    callouts: [
      'Reviews are conversational, not a separate "review mode" she has to navigate to.',
      'Spaced review is the retention engine — "Remember Forever" in practice.',
    ],
  },
  {
    title: 'Sarah starts the next learning step',
    narration: 'Recommendation card opens AWS Core Services. The right rail flips to "live capture" mode — Peraasan extracts concepts as Sarah learns.',
    agentic: 'Right rail shows ⚡ AGENT IS CAPTURING in real time. Concepts appear in the knowledge graph as they\'re identified — no save button, no "mark complete" workflow. The agent is doing the bookkeeping.',
    callouts: [
      'Knowledge capture happens in the background — Sarah just learns, the graph grows.',
      'After session: mastery deltas, gap detection, readiness recompute — all automatic.',
    ],
    takeaway: 'Sarah\'s job is to learn. Peraasan\'s job is everything else — finding, sequencing, capturing, scoring, scheduling reviews, watching for changes.',
  },
]

export default function Scenario02DailyLearning({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  const messages = []

  if (sceneIndex >= 0) {
    messages.push({
      role: 'system',
      content: 'Day 12 · 9:14 AM',
    })
    messages.push({
      role: 'peraasan',
      content: `Good morning, Sarah. Quick status:`,
      card: {
        type: 'progress',
        goal: 'Cloud Architect',
        score: 34,
        concepts: 18,
        gaps: 4,
        streak: 8,
        breakdown: [
          { label: 'Coverage', value: '38', tone: 'warn' },
          { label: 'Mastery', value: '52', tone: 'good' },
          { label: 'Momentum', value: '78', tone: 'good' },
          { label: 'Time fit', value: 'on track', tone: 'good' },
        ],
      },
    })
    messages.push({
      role: 'peraasan',
      content: `You've learned 8 concepts this week — strong momentum. One review is due (Kubernetes Pods, ~2 min).\n\nWhat sounds right?`,
      card: {
        type: 'options',
        options: ['Quick review first', 'Continue path: AWS Core Services', 'Something else'],
      },
    })
  }

  if (sceneIndex >= 1) {
    messages.push({
      role: 'employee',
      content: 'Quick review first',
    })
    messages.push({
      role: 'peraasan',
      content: 'Easy one:',
      card: {
        type: 'review',
        concept: 'Kubernetes Pods',
        question: 'A Pod is crashing in a CrashLoopBackOff state. What are the first 3 things you\'d check?',
      },
    })
    messages.push({
      role: 'employee',
      content: 'kubectl logs, kubectl describe for events, and check resource limits',
    })
    messages.push({
      role: 'peraasan',
      content: 'Perfect recall. ✓ Mastery confirmed. Next review: 14 days.\n\nReady for AWS Core Services?',
    })
  }

  if (sceneIndex >= 2) {
    messages.push({
      role: 'employee',
      content: 'Yes, let\'s do it',
    })
    messages.push({
      role: 'peraasan',
      agentBadge: 'CAPTURING LIVE',
      content: `Pulling it up. I'll watch the session and capture concepts as we go — you don't need to do anything.`,
      card: {
        type: 'recommendation',
        primary: true,
        title: 'AWS Core Services — EC2, S3, VPC',
        source: 'LinkedIn Learning',
        duration: '30 min',
        level: 'Intermediate',
        why: 'It\'s next on your path; you have 30 min before your standup; matches your morning learning rhythm.',
      },
    })
  }

  const context = {
    goal: { name: 'Cloud Architect', score: 34, daysLeft: 192, streak: 8, delta: '↑6 this wk' },
    skills: [
      { name: 'Containers', value: 88 },
      { name: 'Kubernetes', value: 65 },
      { name: 'AWS', value: 22 },
      { name: 'Networking', value: 45 },
      { name: 'Security', value: 38 },
    ],
    stats: { concepts: 18, gaps: 4, sessions: 12 },
    activity: [
      { icon: '📚', text: 'Raj shared "Incident Management Playbook"', time: '12 min ago' },
      { icon: '👥', text: 'James started AWS path', time: '1h ago' },
      { icon: '🎉', text: 'You hit an 8-day streak', time: 'today' },
    ],
  }

  const contextWithLiveCapture = {
    ...context,
    liveCapture: { concept: 'EC2 instance lifecycle', status: 'extracting from session…' },
    pathSummary: { current: 'AWS Core Services (in progress)', next: 'Infrastructure as Code', percent: 42, stepsDone: 5, totalSteps: 12 },
  }

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      <ChatScene
        messages={messages}
        context={sceneIndex >= 2 ? contextWithLiveCapture : context}
        inputDraft={sceneIndex === 0 ? 'Quick review first' : sceneIndex === 1 ? "Yes, let's do it" : null}
      />
    </DemoFrame>
  )
}
