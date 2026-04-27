import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import ChatScene from '../components/ChatScene'

const SCENES = [
  {
    title: 'Sarah opens Aasan for the first time',
    narration: 'No login form, no setup wizard, no preferences page. Aasan opens to a single conversation. Peraasan introduces itself and asks one question.',
    callouts: [
      'No "configure your account" wizard. Just a conversation.',
      'Multilingual opening — "नमस्ते! Bonjour! Hi!" — signals that Peraasan can speak in any of 30+ languages. After this moment, it locks into the employee\'s preferred language (English by default; switchable any time).',
      'The relationship framing: "personal learning coach and co-learner" — not "agent", not "chatbot". The human-order language matters because Peraasan is going to be alongside Sarah for years.',
    ],
    action: 'Click Next to see Sarah respond.',
  },
  {
    title: 'Sarah names her goal',
    narration: 'She types her goal in plain language. Peraasan asks 3 follow-ups to capture the why, the when, and the success criteria.',
    callouts: [
      'Goal Framework = What / Why / When / Success Criteria. This is the anchor for everything Peraasan does.',
      'Conversational, not a form.',
    ],
  },
  {
    title: 'Sarah answers the why / when / success',
    narration: 'In one message Sarah gives the motivation, deadline, and success criteria. Peraasan now has a fully-specified goal.',
    callouts: [
      'A specified goal lets Peraasan score every recommendation against it.',
      'Without "why" + "when" + "success" the recommendation engine is directionless.',
    ],
  },
  {
    title: '⚡ Peraasan generates the path — live',
    narration: 'Watch the agentic moment: Peraasan assesses what Sarah likely already knows from her role, scans available content across all connected sources, builds the full path, and shows it inline. Steps marked "likely known" with refresher option.',
    agentic: 'Peraasan didn\'t just suggest a course — it built a complete 12-step path across Coursera, internal wikis, and YouTube, sequenced by prerequisite, with time estimates, and pre-marked what Sarah already knows. All in the background, in seconds.',
    callouts: [
      'Full path always visible — never skip content. Mark known, offer refresher.',
      'Sources span multiple platforms — Sarah never logs into Coursera, the LMS, etc. Peraasan navigates them.',
      '"Want to start now?" — micro-commitment, low friction.',
    ],
    takeaway: 'Day one, Sarah went from "I want to be a Cloud Architect" to a personalized 12-step path in three messages. No L&D admin involved. No course catalog browsing. The agent did the work.',
  },
]

export default function Scenario01Onboarding({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  // Build messages array based on which scene we're in
  const messages = []

  if (sceneIndex >= 0) {
    messages.push({
      role: 'peraasan',
      content: `नमस्ते! Bonjour! Hi, Sarah —\n\nI'm Peraasan, your personal learning coach and co-learner here at TechCorp. I can speak in any language you prefer; I'll stick with English unless you'd like to switch.\n\nI find the best content from across your company, build your learning path, capture what you learn, and make sure you never forget it.\n\nWhat's the main thing you want to learn or achieve right now?`,
    })
  }

  if (sceneIndex >= 1) {
    messages.push({
      role: 'employee',
      content: 'I want to become a Cloud Architect',
    })
    messages.push({
      role: 'peraasan',
      content: `Great choice. To make this work for you, three quick follow-ups:\n\n• Why is this important to you?\n• Any deadline you're working toward?\n• How will you know you've succeeded?`,
    })
  }

  if (sceneIndex >= 2) {
    messages.push({
      role: 'employee',
      content: `I want to lead our team's cloud migration. By Q4 2026. I'd need to pass the AWS Solutions Architect Pro and lead one migration independently.`,
    })
  }

  if (sceneIndex >= 3) {
    messages.push({
      role: 'peraasan',
      agentBadge: 'PATH GENERATED',
      content: `Got it. I assessed what you likely know from your Senior SWE role, scanned 5,200+ items across Coursera, your team's Confluence, the LMS, and YouTube, and built your path.\n\nHere's your Cloud Architect path — 12 steps, ~40 hours over 8 weeks. You have 192 days, so you've got room.`,
      card: {
        type: 'path',
        title: 'Cloud Architect',
        progress: 0,
        steps: [
          { title: 'Linux Fundamentals', status: 'known', duration: 'refresher 5m' },
          { title: 'Container Basics', status: 'known', duration: 'refresher 5m' },
          { title: 'Kubernetes Architecture', status: 'active', duration: '45m' },
          { title: 'Pods & Deployments', status: 'pending', duration: '40m' },
          { title: 'Services & Networking', status: 'pending', duration: '50m' },
          { title: 'AWS Core Services', status: 'pending', duration: '2h' },
          { title: '...6 more steps', status: 'pending', duration: '' },
        ],
      },
    })
    messages.push({
      role: 'peraasan',
      content: 'Want to start with Kubernetes Architecture right now? I\'ll pull it up.',
      card: {
        type: 'options',
        options: ['Start now', 'Schedule for tomorrow', 'Show me the full path'],
      },
    })
  }

  const inputDraft = sceneIndex === 0
    ? 'I want to become a Cloud Architect'
    : sceneIndex === 1
    ? "I want to lead our team's cloud migration. By Q4 2026..."
    : null

  const context = {
    goal: { name: 'No goal set yet', score: 0, daysLeft: 0, streak: 0 },
    skills: [],
    stats: { concepts: 0, gaps: 0, sessions: 0 },
  }

  // After path is generated, context shows the new goal
  const contextAfterPath = {
    goal: { name: 'Cloud Architect', score: 0, daysLeft: 192, streak: 0, delta: 'new!' },
    skills: [
      { name: 'Containers', value: 60 },
      { name: 'Linux', value: 70 },
      { name: 'Kubernetes', value: 0 },
      { name: 'AWS', value: 0 },
      { name: 'Networking', value: 30 },
    ],
    stats: { concepts: 0, gaps: 0, sessions: 0 },
    pathSummary: { current: 'Kubernetes Architecture', next: 'Pods & Deployments', percent: 0, stepsDone: 0, totalSteps: 12 },
  }

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      <ChatScene
        messages={messages}
        context={sceneIndex >= 3 ? contextAfterPath : context}
        inputDraft={inputDraft}
        agentActive={sceneIndex === 2}
        agentLabel="Peraasan is building your path…"
      />
    </DemoFrame>
  )
}
