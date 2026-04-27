/**
 * Right rail context panel — visual only. Adapts to scenario state via `data` prop.
 */
export default function DemoContextPanel({ data = {} }) {
  const {
    goal = { name: 'Cloud Architect', score: 62, daysLeft: 192, streak: 8 },
    skills = [
      { name: 'Containers', value: 88 },
      { name: 'Kubernetes', value: 72 },
      { name: 'AWS', value: 58 },
      { name: 'Networking', value: 45 },
      { name: 'Security', value: 38 },
    ],
    stats = { concepts: 51, gaps: 13, sessions: 28 },
    activity = [],
    liveCapture, // { concept, status: 'capturing' | 'captured' }
    pathSummary, // { current, next, percent }
    overrideTitle, // for ELW / Manager scenes
    overrideContent, // arbitrary children replacement
  } = data

  if (overrideContent) {
    return (
      <aside className="w-[320px] min-w-[320px] bg-white border-l border-gray-100 overflow-y-auto no-scrollbar">
        {overrideTitle && (
          <div className="px-4 py-4 border-b border-gray-50 sticky top-0 bg-white">
            <p className="text-[9px] text-gray-400 font-semibold tracking-wider">CONTEXT</p>
            <h3 className="font-serif text-[14px] font-bold text-navy mt-0.5">{overrideTitle}</h3>
          </div>
        )}
        <div className="px-4 py-4">{overrideContent}</div>
      </aside>
    )
  }

  return (
    <aside className="w-[320px] min-w-[320px] bg-white border-l border-gray-100 overflow-y-auto no-scrollbar">
      {/* Goal + readiness */}
      <div className="px-4 py-4 border-b border-gray-50">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">PRIMARY GOAL · READINESS</p>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-3xl font-bold text-navy">{goal.score}</span>
          <span className="text-sm text-gray-400">/100</span>
          <span className="ml-auto text-[10px] text-green-600 font-mono">{goal.delta || '↑6'} this wk</span>
        </div>
        <p className="text-[12px] text-text-primary font-medium mt-0.5">{goal.name}</p>
        <p className="text-[10px] text-gray-400">{goal.daysLeft} days left</p>
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-gradient-to-r from-navy to-columbia-blue" style={{ width: `${goal.score}%` }} />
        </div>
      </div>

      {/* Live agent activity */}
      {liveCapture && (
        <div className="px-4 py-3 border-b border-gray-50 bg-gold/5">
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold"></span>
            </span>
            <p className="text-[10px] text-gold font-bold tracking-wider">⚡ AGENT IS CAPTURING</p>
          </div>
          <p className="text-[12px] text-text-primary font-medium">{liveCapture.concept}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{liveCapture.status}</p>
        </div>
      )}

      {/* Path summary */}
      {pathSummary && (
        <div className="px-4 py-3 border-b border-gray-50">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1.5">CURRENT PATH</p>
          <p className="text-[11px] text-gray-600">Now: <span className="text-text-primary font-medium">{pathSummary.current}</span></p>
          <p className="text-[11px] text-gray-600 mt-0.5">Next: <span className="text-text-primary font-medium">{pathSummary.next}</span></p>
          <div className="h-1 bg-gray-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-navy" style={{ width: `${pathSummary.percent}%` }} />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">{pathSummary.percent}% · {pathSummary.stepsDone} of {pathSummary.totalSteps} steps</p>
        </div>
      )}

      {/* Skills */}
      <div className="px-4 py-4 border-b border-gray-50">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2.5">SKILL DEPTH</p>
        <div className="space-y-2">
          {skills.map((s) => (
            <div key={s.name}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[11px] text-text-primary">{s.name}</span>
                <span className="text-[10px] text-gray-400 font-mono">{s.value}</span>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${s.value >= 70 ? 'bg-green-400' : s.value >= 50 ? 'bg-navy' : 'bg-amber-400'}`}
                  style={{ width: `${s.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-3 border-b border-gray-50">
        <div className="flex justify-between text-center">
          <div>
            <p className="font-serif font-bold text-navy text-lg">{stats.concepts}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Concepts</p>
          </div>
          <div>
            <p className="font-serif font-bold text-amber-500 text-lg">{stats.gaps}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Gaps</p>
          </div>
          <div>
            <p className="font-serif font-bold text-gold text-lg">🔥 {goal.streak}</p>
            <p className="text-[9px] text-gray-400 uppercase tracking-wider">Streak</p>
          </div>
        </div>
      </div>

      {/* Activity feed */}
      {activity.length > 0 && (
        <div className="px-4 py-3">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">LIVE ACTIVITY</p>
          <div className="space-y-2.5">
            {activity.map((a, i) => (
              <div key={i} className="flex gap-2 text-[11px]">
                <span className="text-base shrink-0 leading-tight">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-text-primary leading-snug">{a.text}</p>
                  <p className="text-[9px] text-gray-400 mt-0.5">{a.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  )
}
