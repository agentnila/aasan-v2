import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import ChatScene from '../components/ChatScene'

const SCENES = [
  {
    title: 'Sarah finishes a step',
    narration: 'Sarah just completed "Service Mesh with Istio" — mastery 0.7 captured. The session ends naturally with a recap.',
    callouts: [
      'Mastery captured AFTER the session — Peraasan extracted it from the conversation.',
      'But the session also surfaced something: Sarah was assumed to know mTLS, but didn\'t.',
    ],
  },
  {
    title: '⚡ Path Engine fires automatically',
    narration: 'Behind the scenes, /capture/session triggered /path/recompute. The Path Adjustment Engine read the session transcript, the new mastery, and the detected gap. It decided to insert a new step.',
    agentic: 'The engine: Claude Sonnet over (current path + employee state + trigger event). Output: a JSON diff. New step inserted: "mTLS Quickstart (10 min)" — positioned BEFORE AWS Core Services because that step depends on mTLS understanding. Reason captured: "auto: gap detected during Service Mesh session".',
    callouts: [
      'Engine doesn\'t silently change the path — it always tells Sarah what changed and why.',
      'Manual learner edits are SACRED — engine never overrides them.',
      'Bounded change size: if engine would change >30% of pending steps, it instead asks first.',
    ],
  },
  {
    title: 'Peraasan tells Sarah what changed',
    narration: 'Notification card with a clear before/after. Sarah understands the engine\'s reasoning. She\'s in control — she can accept, reorder, or skip.',
    callouts: [
      'The reasoning is the trust mechanism. Without "why", auto-adjustment feels like magic. With "why", it feels like a smart colleague.',
    ],
  },
  {
    title: 'Sarah accepts; the path is now updated',
    narration: 'One tap — the new step is now Sarah\'s next action. She picks it up immediately. The path persists in Airtable; the recompute_history log keeps the audit trail.',
    callouts: [
      'Path is LIVE — different from a static plan. Adjusts on every session, content add, currency flag, manager assignment.',
      'Same engine handles all triggers: session_complete, content_added, freshness_flag, assignment_create, manual edits.',
    ],
    takeaway: 'Every other learning tool builds a path once and forgets it. Aasan\'s path is a curriculum that adapts every time anything changes — performance, content, deprecations, manager priorities. Over a year, it becomes a more accurate plan than a human L&D team could maintain.',
  },
]

export default function Scenario08PathAdjustment({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  const messages = []

  if (sceneIndex >= 0) {
    messages.push({
      role: 'employee',
      content: 'OK, that one was dense but it makes sense now.',
    })
    messages.push({
      role: 'peraasan',
      content: `Great session. Captured 7 concepts, 1 gap I want to flag.\n\nMastery on Service Mesh: 0.7 — solid. Time to next review: 7 days.`,
    })
  }

  if (sceneIndex >= 1) {
    messages.push({
      role: 'system',
      content: '⚡ Path Adjustment Engine running…',
    })
    messages.push({
      role: 'peraasan',
      agentBadge: 'PATH ENGINE',
      content: `One quick thing — the gap I noticed: you assumed mTLS basics during the session ("we just have certs everywhere, right?"), but mTLS isn\'t actually in your knowledge graph yet. AWS Core Services (your next step) depends on knowing how mTLS works for service-to-service auth.\n\nI updated your path:`,
      card: {
        type: 'path-update',
        goal: 'Cloud Architect',
        change: '+ Inserted: "mTLS Quickstart" (10 min) before AWS Core Services',
        reason: 'Gap detected during Service Mesh session. AWS Core Services has mTLS as a prerequisite. Closing the gap first will make the AWS section much faster.',
        before: 'Service Mesh ✓ → AWS Core Services',
        after: 'Service Mesh ✓ → mTLS Quickstart (NEW) → AWS Core Services',
      },
    })
  }

  if (sceneIndex >= 2) {
    messages.push({
      role: 'peraasan',
      content: 'Want to do the mTLS step next, or keep your original ordering and risk struggling on AWS Core Services?',
      card: {
        type: 'options',
        options: ['Yes, mTLS first (recommended)', 'Skip mTLS, continue', 'Show me the full path'],
      },
    })
  }

  if (sceneIndex >= 3) {
    messages.push({
      role: 'employee',
      content: 'mTLS first',
    })
    messages.push({
      role: 'peraasan',
      content: `Done. Your path is updated. Ready when you are.`,
      card: {
        type: 'recommendation',
        primary: true,
        title: 'mTLS Quickstart — Service-to-Service Auth',
        source: 'Internal wiki',
        duration: '10 min',
        level: 'Intermediate',
        why: 'Closes the gap I detected in your Service Mesh session. Required for the AWS Core Services step that follows.',
      },
    })
  }

  const context = {
    goal: { name: 'Cloud Architect', score: 48, daysLeft: 180, streak: 5, delta: '↑10 this wk' },
    skills: [
      { name: 'Containers', value: 88 },
      { name: 'Kubernetes', value: 78 },
      { name: 'AWS', value: 28 },
      { name: 'Networking', value: 65 },
      { name: 'Security', value: 38 },
    ],
    stats: { concepts: 32, gaps: 4, sessions: 16 },
    pathSummary: { current: 'Service Mesh ✓ done', next: 'AWS Core Services', percent: 50, stepsDone: 6, totalSteps: 12 },
  }

  const contextRecomputing = {
    ...context,
    liveCapture: { concept: 'Path Engine running…', status: 'evaluating new mastery + detected gap → diff' },
  }

  const contextAfter = {
    ...context,
    pathSummary: { current: 'mTLS Quickstart (NEW)', next: 'AWS Core Services', percent: 46, stepsDone: 6, totalSteps: 13 },
    activity: [
      { icon: '⚡', text: 'Path Engine inserted mTLS Quickstart', time: 'just now' },
      { icon: '🔍', text: 'Gap closure: mTLS basics', time: 'just now' },
      { icon: '📊', text: 'Path now 13 steps · 46% complete', time: 'just now' },
    ],
  }

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      <ChatScene
        messages={messages}
        context={sceneIndex === 1 ? contextRecomputing : sceneIndex >= 2 ? contextAfter : context}
        agentActive={sceneIndex === 1}
        agentLabel="Path Engine: evaluating gap, recomputing path…"
        inputDraft={sceneIndex === 2 ? 'mTLS first' : null}
      />
    </DemoFrame>
  )
}
