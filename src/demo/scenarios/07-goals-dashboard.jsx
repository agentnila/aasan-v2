import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import GoalsDashboard from '../components/GoalsDashboard'
import PathDetail from '../components/PathDetail'

const SCENES = [
  {
    title: 'Sarah clicks "🎯 My Goals" in the left nav',
    narration: 'The Goals Dashboard is one click from anywhere in Aasan. It surfaces all of Sarah\'s active goals in one view — with status, why, when, success criteria, path progress, and recent path adjustments.',
    callouts: [
      'Three active goals: PRIMARY (career), ASSIGNED (compliance), EXPLORATION (curiosity).',
      'Each goal has its OWN persistent path. They run in parallel.',
      'Notice the readiness ring on each card — single number, color-coded.',
    ],
  },
  {
    title: '⚡ Each goal shows what Peraasan recently did to its path',
    narration: 'The "Recent Path Adjustments by Peraasan" section is the trust mechanism. Sarah can see WHAT the engine changed and WHY — never magic.',
    agentic: 'Path Engine ran 4 times in the past week across Sarah\'s 3 goals. Every adjustment is logged with reason. The engine inserts steps for: gap closure, breaking changes (Currency), new content matching the path, and manager assignments. Manual learner edits are sacred — never overridden.',
    callouts: [
      'Cloud Architect: 2 recent adjustments — gap closure + currency refresher',
      'Compliance: pre-marked "known" steps from last year\'s training',
      'MLOps: inserted feature stores content based on Sarah\'s stated curiosity',
    ],
  },
  {
    title: 'Sarah clicks "Open path detail" on Cloud Architect',
    narration: 'Full ordered list of all 13 steps. Auto-inserted steps are highlighted (gold tint). Manual edits would be too. The "you are here" badge marks the active step.',
    callouts: [
      'Step 5a (topology refresher) and 6a (mTLS) and 10 (Cloud Security) are all auto-inserted by the engine — each with reason.',
      'Mastery + completion date shown for done steps — the audit trail is there.',
      'Bottom line: "Manual edits are sacred — Path Engine never overrides them."',
    ],
    takeaway: 'Three goals. Three live paths. Every adjustment logged with reasoning. This is what a personal curriculum looks like — and no human L&D team could maintain this for every employee. The agent does.',
  },
]

export default function Scenario07GoalsDashboard({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      {sceneIndex < 2 ? (
        <GoalsDashboard onClickGoal={() => setSceneIndex(2)} />
      ) : (
        <PathDetail goalTitle="Cloud Architect" />
      )}
    </DemoFrame>
  )
}
