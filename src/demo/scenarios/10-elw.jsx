import { useState } from 'react'
import DemoFrame from '../DemoFrame'
import ELWDashboard from '../components/ELWDashboard'

const SCENES = [
  {
    title: 'Switch perspective: Maria is the CLO',
    narration: 'Maria runs L&D for TechCorp — 5,000 employees, $2M annual learning budget across 8 platforms. The board just asked: "Are we ready to ship the multi-region platform by Q4?" She has completion data. She doesn\'t have an answer.',
    callouts: [
      'Until Aasan, no CLO could answer this question.',
      'Completion data ≠ capability data.',
    ],
  },
  {
    title: '⚡ The ONE question no CLO can answer today',
    narration: 'Aasan answers it. The big number — 42/100 readiness — rolls up from 187 employee knowledge graphs in Engineering, SRE, and Platform teams. Verified by mastery + currency. Updated continuously.',
    agentic: 'This is the symmetric design at scale. Just like an employee\'s Readiness Score rolls up from their personal knowledge graph, the org\'s Workforce Readiness rolls up from EVERY employee\'s graph. Same framework, every scale. The agent does the aggregation, the verification, and the trend-tracking continuously.',
    callouts: [
      'NOT a survey. NOT manager estimates. Verified mastery from spaced reviews + Currency Watch.',
      '187 employees rolled up. Updated as they learn.',
      '↑8 in 30 days — the trend matters as much as the number.',
    ],
  },
  {
    title: 'Capability map — required vs actual',
    narration: 'The question gets decomposed: what skills does the strategic goal require, and how does the workforce stack up? Aasan derived the requirements from the goal itself (Claude reasoning over the goal text + org context).',
    callouts: [
      'K8s Architects gap: have 3, need 8 — biggest investment area.',
      'Network/Multi-region depth: have 1, need 5 — hardest gap to close internally.',
      'Currency health (94%) — most of what the org knows is still TRUE.',
    ],
  },
  {
    title: '⚡ Aasan recommends prioritized interventions',
    narration: 'Not just "you have a gap." A prioritized plan: who to TRAIN (with auto-generated paths), what to HIRE (with auto-drafted job specs), who to PAIR for mentorship, when to CONTRACT to bridge.',
    agentic: 'The Path Engine that personalizes for individuals also runs at org scale. It identifies which employees have adjacent skills + readiness to upskill, auto-generates their personalized paths, and auto-schedules mentor pairings with the most-mastered practitioners. Maria approves a plan; Aasan executes the workflow.',
    callouts: [
      'TRAIN: 5 named candidates with adjacent skills — paths auto-generated.',
      'HIRE: job specs auto-drafted from gap requirements.',
      'MENTOR: David Kim (deepest practitioner) auto-paired with 3 upskillers.',
      'CONTRACT: 12-week consultant to bridge the network gap during upskilling.',
      'Projected readiness: 42 → 82 by Q4 if plan executes.',
    ],
  },
  {
    title: 'The before/after — what Maria had vs has',
    narration: 'The amber callout at the bottom names the gap that exists in every CLO\'s life today. Aasan closes it.',
    callouts: [
      'Without Aasan: completion rates from 6 platforms, no synthesis.',
      'Without Aasan: a spreadsheet asking each manager to estimate.',
      'Without Aasan: a board slide that says "82% completed" — which doesn\'t answer the strategic question.',
    ],
    takeaway: '"Did they take the training?" is the wrong question. "Are they ready?" is the right one. Aasan is the only platform architected to answer it — and the answer compounds with every session, every concept, every gap closed. This is the moat that no competitor can ship in a quarter.',
  },
]

export default function Scenario10ELW({ scenario }) {
  const [sceneIndex, setSceneIndex] = useState(0)

  return (
    <DemoFrame scenario={scenario} sceneIndex={sceneIndex} setSceneIndex={setSceneIndex} scenes={SCENES}>
      <ELWDashboard scene={sceneIndex} />
    </DemoFrame>
  )
}
