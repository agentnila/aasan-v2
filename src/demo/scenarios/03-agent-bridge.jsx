import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import ChatScene from '../components/ChatScene'

const SCENES = [
  {
    title: 'Sarah pastes a URL into the chat',
    narration: 'Sarah saw a Kubernetes article shared in Slack. She drops the URL into Peraasan instead of opening it. The Agent Bridge indicator at the bottom of the input glows.',
    callouts: [
      'Notice the ⚡ AGENT BRIDGE CONNECTED indicator in the left rail.',
      'Sarah doesn\'t open the link. She delegates the reading.',
    ],
  },
  {
    title: '⚡ Peraasan opens the page in a background tab and reads it',
    narration: 'The Agent Bridge — a Chrome extension running on Perplexity Comet — opens the URL in a hidden tab, extracts the main text (capped at 8K chars), and closes the tab. All without disturbing Sarah.',
    agentic: 'This is the marquee agentic moment. The agent has BROWSER-LEVEL HANDS. It can read any web page on the learner\'s behalf. The reading happens in a background tab and closes when done.',
    callouts: [
      'No copy-paste, no PDF download, no "summarize this for me" prompt engineering.',
      'Real implementation: chrome.tabs.create + chrome.scripting.executeScript + chrome.tabs.remove.',
    ],
  },
  {
    title: 'Peraasan returns a summary tied to Sarah\'s goal',
    narration: 'Not just a summary — Peraasan connects the article to Sarah\'s Cloud Architect goal, identifies which concepts she already knows, and proposes the next step.',
    callouts: [
      'The summary is goal-anchored. Different learners reading the same page would get different framings.',
      'Connects to existing knowledge graph — "you already know X, this builds on it".',
    ],
  },
  {
    title: 'Read-once, remember-forever — 3-layer persistence',
    narration: 'The page is now persisted to 3 layers automatically: Mem0 (so Peraasan remembers it next session), the Content Index (so it\'s searchable later), and Neo4j (concepts captured at exposure-mastery 0.2).',
    agentic: 'Read once → remember forever. The agent didn\'t just summarize the page in the moment; it folded the knowledge into the learner\'s permanent graph. Future sessions can reference it. Sarah will be reminded of it months from now.',
    callouts: [
      'Mastery captured at 0.2 — "exposure", not "mastered". Sarah was exposed to the summary, not tested on it.',
      'Mastery only rises when Sarah engages — Q&A, takes a quiz, passes a spaced review.',
      'This prevents the knowledge graph from inflating with claims Sarah can\'t back up.',
    ],
    takeaway: 'Aasan is the only learning agent with browser-level hands. Every other tool waits for the learner to do the reading. Peraasan does the reading and folds it into a permanent knowledge graph at calibrated mastery.',
  },
]

const URL_TO_READ = 'https://kubernetes.io/docs/concepts/services-networking/service/'

export default function Scenario03AgentBridge({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  const messages = []

  if (sceneIndex >= 0) {
    messages.push({
      role: 'employee',
      content: `Found this in Slack — can you read it for me? ${URL_TO_READ}`,
    })
  }

  if (sceneIndex >= 1) {
    messages.push({
      role: 'peraasan',
      agentBadge: 'AGENT BRIDGE',
      content: 'On it. Opening the page in a background tab, extracting content, closing the tab. Give me a few seconds…',
    })
  }

  if (sceneIndex >= 2) {
    messages.push({
      role: 'peraasan',
      content: 'Read it. Here\'s what matters for your Cloud Architect path:',
      card: {
        type: 'page-read',
        url: URL_TO_READ,
        title: 'Service · Kubernetes',
        summary: 'Covers the four service types (ClusterIP, NodePort, LoadBalancer, ExternalName), how they map to Pods via selectors, and how kube-proxy implements routing. The piece on topologyKeys is now deprecated — flagged for refresher (more on that in scenario 5). You already know Pods and Deployments — this is the natural next layer.',
        persistedTo: ['Mem0 memory', 'Content Index', 'Neo4j (4 concepts @ mastery 0.2)'],
      },
    })
  }

  if (sceneIndex >= 3) {
    messages.push({
      role: 'peraasan',
      content: 'Captured 4 concepts at exposure mastery (0.2). They\'ll show up in your knowledge graph but won\'t count toward your readiness score until you engage with them — ask me a question, take a quiz, or pass a spaced review.\n\nWant me to quiz you on Services now? Or save this for later?',
      card: {
        type: 'options',
        options: ['Quiz me now', 'Save for later', 'Add to my path'],
      },
    })
  }

  const inputDraft = sceneIndex === 0
    ? null
    : null

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
  }

  const contextActive = {
    ...context,
    liveCapture: { concept: 'Reading kubernetes.io/docs/concepts/services-networking/service/', status: 'background tab open · extracting…' },
  }

  const contextAfter = {
    ...context,
    stats: { concepts: 22, gaps: 4, sessions: 12 },
    skills: [
      { name: 'Containers', value: 88 },
      { name: 'Kubernetes', value: 68 },
      { name: 'AWS', value: 22 },
      { name: 'Networking', value: 47 },
      { name: 'Security', value: 38 },
    ],
    activity: [
      { icon: '⚡', text: 'Agent Bridge read kubernetes.io/services', time: 'just now' },
      { icon: '📊', text: '+4 concepts captured @ 0.2 (exposure)', time: 'just now' },
      { icon: '🔁', text: 'Memory written to Mem0', time: 'just now' },
    ],
  }

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      <ChatScene
        messages={messages}
        context={sceneIndex === 1 ? contextActive : sceneIndex >= 2 ? contextAfter : context}
        agentActive={sceneIndex === 1}
        agentLabel="Agent Bridge: reading page in background tab…"
      />
    </DemoFrame>
  )
}
