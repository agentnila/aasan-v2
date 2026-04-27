import DemoSourcesNav from './DemoSourcesNav'

const GOALS = [
  {
    id: 'cloud-architect',
    badge: 'PRIMARY',
    badgeColor: 'bg-navy text-gold',
    title: 'Cloud Architect',
    why: 'Lead our team\'s cloud migration, get promoted to Staff Engineer',
    when: 'Q4 2026',
    daysLeft: 180,
    success: 'Pass AWS Solutions Architect Pro + lead one migration independently',
    readiness: 48,
    delta: '+10 this wk',
    pathProgress: 46,
    pathStep: 'Step 6 of 13 — mTLS Quickstart',
    recentAdjustments: [
      { icon: '⚡', text: 'Inserted "mTLS Quickstart" — gap detected during Service Mesh session', when: 'today' },
      { icon: '↻', text: 'Inserted "K8s 1.31 topology refresher" — breaking change in upstream docs', when: '2d ago' },
    ],
    primaryAction: 'Continue path',
  },
  {
    id: 'compliance',
    badge: 'ASSIGNED',
    badgeColor: 'bg-blue-600 text-white',
    title: 'Data Privacy Compliance 2026',
    why: 'Annual mandatory compliance training — required by Legal',
    when: 'June 30, 2026',
    daysLeft: 64,
    success: 'Complete + retain 80%+ at 30-day spaced review',
    readiness: 35,
    delta: '+15 this wk',
    pathProgress: 33,
    pathStep: 'Step 1 of 3 — PII handling for engineers',
    recentAdjustments: [
      { icon: '✓', text: 'Engine pre-marked "Data classification" as known (you completed last year\'s version)', when: '5d ago' },
    ],
    primaryAction: 'Continue path',
  },
  {
    id: 'mlops',
    badge: 'EXPLORATION',
    badgeColor: 'bg-purple-100 text-purple-700',
    title: 'Learn about MLOps',
    why: 'Curious; might bridge to next role; could combine with Cloud expertise',
    when: 'No deadline',
    daysLeft: null,
    success: 'Be able to evaluate "do we need an MLOps engineer?" decisions confidently',
    readiness: 12,
    delta: 'new',
    pathProgress: 25,
    pathStep: 'Step 2 of 8 — Model serving fundamentals',
    recentAdjustments: [
      { icon: '⚡', text: 'Inserted "Feature stores" — content matched your stated curiosity around data pipelines', when: '4d ago' },
    ],
    primaryAction: 'Continue path',
  },
]

export default function GoalsDashboard({ onClickGoal }) {
  return (
    <div className="flex h-full w-full bg-bg overflow-hidden">
      <DemoSourcesNav />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider">🎯 MY GOALS</p>
              <h1 className="font-serif text-3xl font-bold text-navy mt-1">3 active goals</h1>
              <p className="text-sm text-gray-500 mt-1">Each goal has its own live learning path. Path adjustments are surfaced on the cards below.</p>
            </div>
            <button className="px-4 py-2 rounded-lg bg-navy text-white text-[12px] font-semibold hover:bg-navy/90">
              + Set new goal
            </button>
          </div>

          {/* Goal cards */}
          <div className="space-y-5">
            {GOALS.map((g) => (
              <div
                key={g.id}
                className="bg-white border border-gray-100 rounded-xl p-5 hover:border-navy/30 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* Readiness ring */}
                  <div className="shrink-0 w-20 text-center">
                    <p className={`inline-block px-2 py-0.5 rounded text-[8px] font-bold tracking-wider ${g.badgeColor}`}>
                      {g.badge}
                    </p>
                    <div className="mt-3 relative w-20 h-20 mx-auto">
                      <svg viewBox="0 0 36 36" className="w-full h-full">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#e5e7eb" strokeWidth="3" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none" stroke="#1a3a6b" strokeWidth="3"
                          strokeDasharray={`${g.readiness}, 100`} strokeLinecap="round" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="font-serif text-xl font-bold text-navy">{g.readiness}</span>
                        <span className="text-[8px] text-gray-400 -mt-0.5">readiness</span>
                      </div>
                    </div>
                    <p className={`text-[10px] mt-1 font-mono ${g.delta.startsWith('+') ? 'text-green-600' : 'text-gray-400'}`}>{g.delta}</p>
                  </div>

                  {/* Goal body */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif text-xl font-bold text-text-primary leading-tight">{g.title}</h3>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-[12px]">
                      <div>
                        <p className="text-[9px] text-gray-400 font-semibold tracking-wider">WHY</p>
                        <p className="text-text-primary mt-0.5">{g.why}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 font-semibold tracking-wider">WHEN</p>
                        <p className="text-text-primary mt-0.5">
                          {g.when} {g.daysLeft && <span className="text-gray-400">· {g.daysLeft} days left</span>}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-[9px] text-gray-400 font-semibold tracking-wider">SUCCESS CRITERIA</p>
                        <p className="text-text-primary mt-0.5">{g.success}</p>
                      </div>
                    </div>

                    {/* Path progress */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] text-gray-400 font-semibold tracking-wider">LIVE PATH</span>
                        <span className="text-[11px] font-mono text-navy">{g.pathProgress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full bg-gradient-to-r from-navy to-columbia-blue" style={{ width: `${g.pathProgress}%` }} />
                      </div>
                      <p className="text-[12px] text-text-primary">{g.pathStep}</p>

                      {/* Recent path adjustments */}
                      {g.recentAdjustments.length > 0 && (
                        <div className="mt-3 px-3 py-2 rounded-lg bg-gold/5 border border-gold/20">
                          <p className="text-[9px] text-gold font-bold tracking-wider mb-1.5">⚡ RECENT PATH ADJUSTMENTS BY PERAASAN</p>
                          {g.recentAdjustments.map((a, i) => (
                            <p key={i} className="text-[11px] text-text-primary leading-relaxed mt-1 flex gap-2">
                              <span>{a.icon}</span>
                              <span className="flex-1">{a.text}</span>
                              <span className="text-[10px] text-gray-400 shrink-0">{a.when}</span>
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => onClickGoal && onClickGoal(g.id)}
                          className="px-4 py-2 rounded-lg bg-navy text-white text-[11px] font-semibold hover:bg-navy/90"
                        >
                          {g.primaryAction}
                        </button>
                        <button
                          onClick={() => onClickGoal && onClickGoal(g.id)}
                          className="px-4 py-2 rounded-lg border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50"
                        >
                          Open path detail
                        </button>
                        <button className="px-4 py-2 rounded-lg border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50">
                          Edit goal
                        </button>
                        <button className="ml-auto px-4 py-2 rounded-lg text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50">
                          Pause
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Other sections */}
          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider">COMPLETED · 1</p>
              <p className="text-[13px] text-text-primary mt-1">Onboarding to TechCorp Engineering</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Achieved Apr 2026 · 14 concepts retained</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider">PAUSED · 0</p>
              <p className="text-[13px] text-gray-400 mt-1 italic">Pause a goal anytime — Aasan keeps the knowledge graph intact.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
