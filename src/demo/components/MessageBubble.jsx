/**
 * Visual-only message bubble for demo. Mirrors the real one but renders
 * pre-canned cards by type. No real API or Clerk dependencies.
 */
export default function MessageBubble({ message }) {
  const { role, content, card, agentBadge, timestamp } = message
  const isUser = role === 'user' || role === 'employee'
  const isManager = role === 'manager' || role === 'admin'

  if (role === 'system') {
    return (
      <div className="flex justify-center my-4">
        <div className="px-3 py-1.5 rounded-full bg-gray-100 text-[10px] text-gray-500 font-medium tracking-wider uppercase">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[640px] ${isUser ? 'order-2' : ''}`}>
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-gold">
                <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
              </svg>
            </div>
            <span className="text-[11px] font-semibold text-navy">Peraasan</span>
            {agentBadge && (
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider bg-gold/10 text-gold border border-gold/20">
                ⚡ {agentBadge}
              </span>
            )}
          </div>
        )}

        {/* Text content */}
        {content && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
              isUser
                ? 'bg-navy text-white rounded-br-md'
                : isManager
                ? 'bg-gold/10 text-text-primary rounded-bl-md border border-gold/20'
                : 'bg-chat-ai text-text-primary rounded-bl-md'
            }`}
          >
            {content}
          </div>
        )}

        {/* Card slot */}
        {card && (
          <div className="mt-2">
            <Card card={card} />
          </div>
        )}

        {timestamp && (
          <p className={`text-[9px] text-gray-400 mt-1 px-1 ${isUser ? 'text-right' : ''}`}>{timestamp}</p>
        )}
      </div>
    </div>
  )
}

function Card({ card }) {
  switch (card.type) {
    case 'recommendation':
      return <RecommendationCard {...card} />
    case 'path':
      return <PathCard {...card} />
    case 'progress':
      return <ProgressCard {...card} />
    case 'review':
      return <ReviewCard {...card} />
    case 'focus':
      return <FocusCard {...card} />
    case 'currency':
      return <CurrencyCard {...card} />
    case 'doc-change':
      return <DocChangeCard {...card} />
    case 'page-read':
      return <PageReadCard {...card} />
    case 'continuity':
      return <ContinuityCard {...card} />
    case 'path-update':
      return <PathUpdateCard {...card} />
    case 'team-readiness':
      return <TeamReadinessCard {...card} />
    case 'assignment-confirm':
      return <AssignmentConfirmCard {...card} />
    case 'options':
      return <OptionsCard {...card} />
    default:
      return null
  }
}

function RecommendationCard({ title, source, duration, level, why, primary }) {
  return (
    <div className={`rounded-xl border bg-white p-4 max-w-md ${primary ? 'border-navy/30 shadow-sm' : 'border-gray-200'}`}>
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-navy/5 flex items-center justify-center text-navy shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">{source} · {duration} · {level}</p>
          <h4 className="text-[14px] font-semibold text-text-primary leading-snug mt-0.5">{title}</h4>
          {why && <p className="text-[12px] text-gray-600 mt-2 leading-relaxed"><span className="font-semibold text-navy">Why this:</span> {why}</p>}
          <div className="flex gap-2 mt-3">
            <button className="px-3 py-1.5 rounded-lg bg-navy text-white text-[11px] font-medium hover:bg-navy/90">Start learning</button>
            <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-[11px] text-gray-600 hover:bg-gray-50">Save for later</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PathCard({ title, progress, steps }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Learning path</p>
          <h4 className="text-[14px] font-semibold text-text-primary">{title}</h4>
        </div>
        <span className="text-[11px] font-mono text-navy bg-navy/5 px-2 py-0.5 rounded">{progress}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className="h-full bg-navy" style={{ width: `${progress}%` }} />
      </div>
      <div className="space-y-1.5">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="w-5 text-center">
              {step.status === 'done' && <span className="text-green-500">✓</span>}
              {step.status === 'active' && <span className="text-navy">→</span>}
              {step.status === 'known' && <span className="text-gray-400">○</span>}
              {step.status === 'pending' && <span className="text-gray-300">○</span>}
              {step.status === 'stale' && <span className="text-amber-500">↻</span>}
            </span>
            <span className={`flex-1 ${step.status === 'done' ? 'text-gray-400 line-through' : step.status === 'active' ? 'text-text-primary font-semibold' : 'text-gray-600'}`}>
              {step.title}
            </span>
            {step.duration && <span className="text-[10px] text-gray-400">{step.duration}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}

function ProgressCard({ goal, score, concepts, gaps, streak, breakdown }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 max-w-md">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Readiness · {goal}</p>
      <div className="flex items-baseline gap-1 mt-1">
        <span className="font-serif text-3xl font-bold text-navy">{score}</span>
        <span className="text-sm text-gray-400">/100</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2 mb-3">
        <div className="h-full bg-gradient-to-r from-navy to-columbia-blue" style={{ width: `${score}%` }} />
      </div>
      {breakdown && (
        <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600">
          {breakdown.map((b, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${b.tone === 'good' ? 'bg-green-400' : b.tone === 'warn' ? 'bg-amber-400' : 'bg-gray-300'}`} />
              <span>{b.label}</span>
              <span className="ml-auto font-mono text-gray-500">{b.value}</span>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-3 text-[10px] text-gray-400 mt-3 pt-3 border-t border-gray-100">
        <span><span className="font-semibold text-navy">{concepts}</span> concepts</span>
        <span><span className="font-semibold text-amber-500">{gaps}</span> gaps</span>
        <span><span className="font-semibold text-gold">🔥 {streak}</span> streak</span>
      </div>
    </div>
  )
}

function ReviewCard({ concept, question }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 max-w-md">
      <p className="text-[10px] text-gold font-semibold tracking-wider uppercase">↻ Quick Review · {concept}</p>
      <p className="text-[14px] text-text-primary mt-2 mb-3 font-medium leading-snug">{question}</p>
      <div className="flex gap-2">
        <button className="flex-1 px-3 py-2 rounded-lg bg-navy text-white text-[12px] font-medium hover:bg-navy/90">I know this</button>
        <button className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50">Show me</button>
      </div>
    </div>
  )
}

function FocusCard({ duration, label }) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-navy to-[#0f2a52] text-white p-4 max-w-md">
      <p className="text-[10px] text-gold uppercase tracking-wider font-semibold">⏱ Focus session</p>
      <h4 className="font-serif text-lg mt-1">{label || `Just ${duration} minutes`}</h4>
      <p className="text-[12px] text-white/70 mt-1 leading-relaxed">No interruptions. Peraasan studies alongside you.</p>
      <button className="mt-3 px-4 py-2 rounded-lg bg-gold text-navy text-[12px] font-bold hover:bg-gold/90 w-full">Start focus</button>
    </div>
  )
}

function CurrencyCard({ concept, source, learnedDate, change, severity, refreshDuration }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 max-w-md">
      <p className="text-[10px] text-amber-700 font-bold tracking-wider uppercase">↻ Knowledge currency · {severity || 'breaking change'}</p>
      <h4 className="text-[14px] font-semibold text-text-primary mt-1.5 leading-snug">{concept}</h4>
      <p className="text-[11px] text-gray-500 mt-1">You learned this on {learnedDate} · Source: {source}</p>
      <div className="mt-3 px-3 py-2 rounded-lg bg-white border border-amber-100">
        <p className="text-[12px] text-text-primary leading-relaxed"><span className="font-semibold">What changed:</span> {change}</p>
      </div>
      <div className="flex gap-2 mt-3">
        <button className="flex-1 px-3 py-2 rounded-lg bg-amber-600 text-white text-[12px] font-medium hover:bg-amber-700">Refresh ({refreshDuration})</button>
        <button className="px-3 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50">Later</button>
      </div>
    </div>
  )
}

function DocChangeCard({ docTitle, lastRead, severity, change }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 max-w-md">
      <p className="text-[10px] text-blue-700 font-bold tracking-wider uppercase">📄 Internal doc change · {severity}</p>
      <h4 className="text-[14px] font-semibold text-text-primary mt-1.5 leading-snug">{docTitle}</h4>
      <p className="text-[11px] text-gray-500 mt-1">You read this on {lastRead}</p>
      <div className="mt-3 px-3 py-2 rounded-lg bg-white border border-blue-100">
        <p className="text-[12px] text-text-primary leading-relaxed"><span className="font-semibold">Substantive change:</span> {change}</p>
      </div>
      <p className="text-[11px] text-gray-500 mt-2 italic">Cosmetic edits to this doc were silently absorbed. This one mattered.</p>
      <div className="flex gap-2 mt-3">
        <button className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-medium hover:bg-blue-700">See diff</button>
        <button className="px-3 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50">Got it</button>
      </div>
    </div>
  )
}

function PageReadCard({ url, title, summary, persistedTo }) {
  return (
    <div className="rounded-xl border border-purple-200 bg-purple-50/30 p-4 max-w-md">
      <p className="text-[10px] text-purple-700 font-bold tracking-wider uppercase">⚡ Agent Bridge · Page read</p>
      <p className="text-[10px] text-gray-400 mt-1 truncate font-mono">{url}</p>
      <h4 className="text-[14px] font-semibold text-text-primary mt-1 leading-snug">{title}</h4>
      <p className="text-[12px] text-gray-600 mt-2 leading-relaxed">{summary}</p>
      <div className="mt-3 pt-3 border-t border-purple-100">
        <p className="text-[10px] text-purple-700 font-semibold tracking-wider mb-1.5">PERSISTED TO 3 LAYERS</p>
        <div className="flex flex-wrap gap-1.5">
          {persistedTo.map((p, i) => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-white border border-purple-200 text-[10px] text-purple-700 font-mono">
              {p}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 mt-2 italic">
          Mastery captured at <span className="font-mono text-purple-700">0.2</span> — exposure, not active learning. Mastery rises only when you engage.
        </p>
      </div>
    </div>
  )
}

function ContinuityCard({ lastSession, lastTopic, pathStep, bundle }) {
  return (
    <div className="rounded-xl border border-navy/20 bg-white p-4 max-w-md">
      <p className="text-[10px] text-navy font-bold tracking-wider uppercase">🔁 Picking up where you left off</p>
      <p className="text-[11px] text-gray-500 mt-1">Last session: {lastSession}</p>
      <div className="mt-3 space-y-2">
        <div className="flex gap-2">
          <span className="text-navy">→</span>
          <p className="text-[12px] text-text-primary"><span className="font-semibold">Last topic:</span> {lastTopic}</p>
        </div>
        <div className="flex gap-2">
          <span className="text-navy">→</span>
          <p className="text-[12px] text-text-primary"><span className="font-semibold">Next on your path:</span> {pathStep}</p>
        </div>
      </div>
      {bundle && bundle.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1.5">WHILE YOU WERE AWAY</p>
          {bundle.map((item, i) => (
            <p key={i} className="text-[12px] text-text-primary leading-relaxed mt-1.5 flex gap-2">
              <span className={item.tone === 'currency' ? 'text-amber-500' : item.tone === 'doc' ? 'text-blue-500' : 'text-navy'}>
                {item.icon || '•'}
              </span>
              <span>{item.text}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function PathUpdateCard({ goal, change, reason, before, after }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50/40 p-4 max-w-md">
      <p className="text-[10px] text-green-700 font-bold tracking-wider uppercase">⚡ Path Engine · Auto-adjustment</p>
      <h4 className="text-[14px] font-semibold text-text-primary mt-1.5 leading-snug">{goal} path updated</h4>
      <p className="text-[12px] text-gray-600 mt-2 leading-relaxed"><span className="font-semibold text-green-700">{change}</span></p>
      <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed italic">Why: {reason}</p>
      {(before || after) && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
          {before && (
            <div className="px-2 py-1.5 rounded bg-white border border-gray-200">
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">Before</p>
              <p className="text-gray-600 mt-0.5">{before}</p>
            </div>
          )}
          {after && (
            <div className="px-2 py-1.5 rounded bg-white border border-green-300">
              <p className="text-[9px] text-green-600 uppercase tracking-wider">After</p>
              <p className="text-text-primary mt-0.5 font-medium">{after}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TeamReadinessCard({ teamName, members }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 max-w-md">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">Team readiness · {teamName}</p>
      <div className="space-y-2 mt-3">
        {members.map((m, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-navy/10 flex items-center justify-center text-[11px] font-semibold text-navy shrink-0">
              {m.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[12px] font-medium text-text-primary truncate">{m.name}</p>
                <span className={`text-[9px] px-1.5 py-0.5 rounded ${m.trend === 'up' ? 'bg-green-100 text-green-700' : m.trend === 'down' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                  {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '–'} {m.delta}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-navy" style={{ width: `${m.score}%` }} />
                </div>
                <span className="text-[10px] font-mono text-gray-500 shrink-0">{m.score}</span>
              </div>
              {m.note && <p className="text-[10px] text-gray-400 mt-0.5">{m.note}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssignmentConfirmCard({ to, what, etaSummary }) {
  return (
    <div className="rounded-xl border border-green-200 bg-green-50/40 p-4 max-w-md">
      <p className="text-[10px] text-green-700 font-bold tracking-wider uppercase">✓ Assignment created · Peraasan handled it</p>
      <p className="text-[13px] text-text-primary mt-2"><span className="font-semibold">Assigned:</span> {what}</p>
      <p className="text-[13px] text-text-primary mt-1"><span className="font-semibold">To:</span> {to}</p>
      {etaSummary && <p className="text-[11px] text-gray-600 mt-2 leading-relaxed italic">{etaSummary}</p>}
    </div>
  )
}

function OptionsCard({ options }) {
  return (
    <div className="flex flex-wrap gap-2 max-w-md mt-1">
      {options.map((opt, i) => (
        <button
          key={i}
          className="px-3 py-1.5 rounded-full bg-white border border-navy/20 text-[12px] text-navy hover:bg-navy hover:text-white transition-colors font-medium"
        >
          {opt}
        </button>
      ))}
    </div>
  )
}
