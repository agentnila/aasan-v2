export default function MessageBubble({ message, onAction }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} gap-2.5`}>
      {/* Avatar (Peraasan only) */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-navy to-columbia-blue flex items-center justify-center text-white text-[10px] font-semibold shrink-0 mt-1">
          P
        </div>
      )}

      <div className={`max-w-[85%] ${isUser ? "" : ""}`}>
        {/* Text */}
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-navy text-white rounded-br-md"
              : "bg-chat-ai text-text-primary rounded-bl-md"
          }`}
        >
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        </div>

        {/* Rich Cards */}
        {message.cards &&
          message.cards.map((card, i) => (
            <div key={i} className="mt-2.5">
              {card.type === "recommendation" && (
                <RecommendationCard card={card} onAction={onAction} />
              )}
              {card.type === "progress" && <ProgressCard card={card} />}
              {card.type === "learning_path" && (
                <LearningPathCard card={card} onAction={onAction} />
              )}
              {card.type === "quick_options" && (
                <QuickOptionsCard card={card} onAction={onAction} />
              )}
              {card.type === "review" && (
                <ReviewCard card={card} onAction={onAction} />
              )}
              {card.type === "scheduling" && (
                <SchedulingCard card={card} onAction={onAction} />
              )}
              {card.type === "calendar_slots" && (
                <CalendarSlotsCard card={card} onAction={onAction} />
              )}
              {card.type === "focus_start" && (
                <FocusStartCard card={card} onAction={onAction} />
              )}
              {card.type === "currency_digest" && (
                <CurrencyDigestCard card={card} onAction={onAction} />
              )}
              {card.type === "career_digest" && (
                <CareerDigestCard card={card} onAction={onAction} />
              )}
              {card.type === "predigest" && (
                <PredigestCard card={card} onAction={onAction} />
              )}
              {card.type === "goals_dashboard" && (
                <GoalsDashboardCard card={card} onAction={onAction} />
              )}
              {card.type === "path_update" && (
                <PathUpdateCard card={card} onAction={onAction} />
              )}
              {card.type === "sme_match" && (
                <SMEMatchCard card={card} onAction={onAction} />
              )}
              {card.type === "stay_ahead" && (
                <StayAheadCard card={card} onAction={onAction} />
              )}
              {card.type === "scenario_simulation" && (
                <ScenarioSimulationCard card={card} onAction={onAction} />
              )}
              {card.type === "journal_added" && (
                <JournalAddedCard card={card} onAction={onAction} />
              )}
              {card.type === "tailored_resume" && (
                <TailoredResumeCard card={card} onAction={onAction} />
              )}
            </div>
          ))}
      </div>
    </div>
  );
}

function RecommendationCard({ card, onAction }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
      {/* Primary recommendation */}
      <div className="p-4 border-b border-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-navy" />
          <span className="text-[10px] text-navy font-semibold tracking-wider">RECOMMENDED</span>
        </div>
        <p className="text-[14px] font-semibold text-text-primary">
          {card.primary.title}
        </p>
        <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-400">
          <span>{card.primary.source}</span>
          <span>·</span>
          <span>{card.primary.duration}</span>
        </div>
        <p className="text-[11px] text-navy/70 mt-2 leading-snug">
          {card.primary.reason}
        </p>
        <button
          onClick={() => onAction(`Start: ${card.primary.title}`)}
          className="mt-3 w-full py-2.5 bg-navy text-white text-[12px] font-medium rounded-lg hover:bg-navy/90 transition-all"
        >
          Start Learning
        </button>
      </div>
      {/* Alternatives */}
      <div className="px-4 py-3">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">ALSO AVAILABLE</p>
        {card.alternatives.map((alt, i) => (
          <button
            key={i}
            onClick={() => onAction(`Tell me about: ${alt.title}`)}
            className="flex items-center justify-between w-full py-1.5 text-left hover:bg-gray-50 rounded px-1 -mx-1 transition-colors"
          >
            <span className="text-[12px] text-text-primary">{alt.title}</span>
            <span className="text-[10px] text-gray-400 shrink-0 ml-2">{alt.duration}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ProgressCard({ card }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider">READINESS</p>
          <p className="text-[14px] font-bold text-text-primary mt-0.5">{card.goal}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-navy">{card.readiness}</span>
          <span className="text-[11px] text-gray-400">/100</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
        <div className="bg-navy rounded-full h-2" style={{ width: `${card.readiness}%` }} />
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-[16px] font-bold text-text-primary">{card.concepts}</p>
          <p className="text-[9px] text-gray-400">concepts</p>
        </div>
        <div>
          <p className="text-[16px] font-bold text-red-500">{card.gaps}</p>
          <p className="text-[9px] text-gray-400">gaps</p>
        </div>
        <div>
          <p className="text-[16px] font-bold text-gold">{card.streak}</p>
          <p className="text-[9px] text-gray-400">day streak</p>
        </div>
      </div>
      {card.topGap && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
          <p className="text-[11px] text-gray-500">
            Top gap: <span className="font-medium text-text-primary">{card.topGap}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function LearningPathCard({ card, onAction }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <p className="text-[10px] text-navy font-semibold tracking-wider mb-3">{card.title.toUpperCase()}</p>
      <div className="flex flex-col gap-1.5">
        {card.steps.map((step, i) => (
          <div
            key={i}
            className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg ${
              step.status === "next" ? "bg-navy/5 border border-navy/20" : ""
            }`}
          >
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold ${
              step.status === "known"
                ? "bg-green-100 text-green-600"
                : step.status === "next"
                ? "bg-navy text-white"
                : "bg-gray-100 text-gray-400"
            }`}>
              {step.status === "known" ? "✓" : i + 1}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-[12px] ${
                step.status === "known" ? "text-gray-400" : "text-text-primary font-medium"
              }`}>
                {step.title}
                {step.status === "known" && <span className="text-[10px] text-green-500 ml-1.5">likely known</span>}
              </p>
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">{step.duration}</span>
          </div>
        ))}
      </div>
      <button
        onClick={() => onAction("Start the next step")}
        className="mt-3 w-full py-2.5 bg-navy text-white text-[12px] font-medium rounded-lg hover:bg-navy/90 transition-all"
      >
        Start: {card.steps.find(s => s.status === "next")?.title || "Next Step"}
      </button>
    </div>
  );
}

function QuickOptionsCard({ card, onAction }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-3">
      <div className="flex flex-col gap-1.5">
        {card.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => onAction(opt.title)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-left w-full"
          >
            <span className="text-[14px]">{opt.icon}</span>
            <span className="text-[12px] text-text-primary font-medium">{opt.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ card, onAction }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] bg-gold/10 text-gold px-2 py-0.5 rounded-full font-semibold">REVIEW</span>
        <span className="text-[11px] text-gray-400">{card.concept}</span>
      </div>
      <p className="text-[13px] text-text-primary font-medium leading-snug mb-4">
        {card.question}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onAction("A Pod is the smallest unit, it wraps one or more containers with shared network and storage")}
          className="flex-1 py-2 text-[11px] font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          I know this
        </button>
        <button
          onClick={() => onAction("I'm not sure about the difference")}
          className="flex-1 py-2 text-[11px] font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Show me
        </button>
      </div>
    </div>
  );
}

function SchedulingCard({ card, onAction }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <p className="text-[12px] text-gray-600 leading-relaxed mb-3">
        {card.message}
      </p>
      <div className="flex flex-col gap-2">
        {card.actions.map((action, i) => (
          <button
            key={i}
            onClick={() => onAction(action.label)}
            className={`w-full py-2.5 text-[12px] font-medium rounded-lg transition-all ${
              i === 0
                ? "bg-navy text-white hover:bg-navy/90"
                : "border border-gray-200 text-text-primary hover:border-navy hover:text-navy"
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function CalendarSlotsCard({ card, onAction }) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-navy">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="text-[10px] text-navy font-semibold tracking-wider">AVAILABLE SLOTS</span>
      </div>
      <div className="flex flex-col gap-2">
        {card.slots.map((slot, i) => (
          <button
            key={i}
            onClick={() => onAction(`Schedule for ${slot.day} at ${slot.time}`)}
            className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-navy/30 hover:bg-navy/[0.02] transition-all text-left w-full group"
          >
            <div className="w-10 text-center shrink-0">
              <p className="text-[10px] text-gray-400 font-medium">{slot.day}</p>
              <p className="text-[12px] font-bold text-text-primary">{slot.time.split(" – ")[0]}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-text-primary">{slot.time}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{slot.fit}</p>
            </div>
            <span className="text-[10px] text-navy opacity-0 group-hover:opacity-100 font-medium transition-opacity shrink-0">
              Book →
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function FocusStartCard({ card, onAction }) {
  return (
    <div className="bg-gradient-to-br from-navy to-navy/80 rounded-xl shadow-sm p-5 text-white">
      <div className="flex items-center gap-2 mb-3">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span className="text-[10px] font-semibold tracking-wider opacity-70">FOCUS SESSION</span>
      </div>
      <p className="text-[14px] font-semibold mb-1">{card.title}</p>
      <div className="flex items-center gap-2 text-[11px] opacity-70 mb-4">
        <span>{card.source}</span>
        <span>·</span>
        <span>{card.commitment}</span>
      </div>
      <button
        onClick={() => onAction("Starting focus session now")}
        className="w-full py-2.5 bg-white text-navy text-[12px] font-semibold rounded-lg hover:bg-white/90 transition-all"
      >
        Start Focus — Just 5 minutes
      </button>
    </div>
  );
}

function ModeBadge({ mode, label }) {
  const live = mode === 'live';
  const stub = mode === 'stub' || mode === 'client_stub';
  const wrapClass = `text-[9px] font-mono px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${
    live
      ? 'bg-green-50 text-green-700 border border-green-200'
      : stub
      ? 'bg-amber-50 text-amber-700 border border-amber-200'
      : 'bg-gray-50 text-gray-500 border border-gray-200'
  }`;
  const dotClass = `w-1 h-1 rounded-full ${
    live ? 'bg-green-500' : stub ? 'bg-amber-500' : 'bg-gray-400'
  }`;
  return (
    <span className={wrapClass}>
      <span className={dotClass} />
      {label}: {live ? 'live' : stub ? 'stub' : '?'}
    </span>
  );
}

function CurrencyDigestCard({ card, onAction }) {
  const verdicts = card.verdicts || [];
  const notifications = card.notifications || [];
  const breaking = notifications.filter(v => v.category === 'breaking');
  const substantive = notifications.filter(v => v.category === 'substantive');
  const noChange = verdicts.filter(v => !v.should_notify);

  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/40 to-white p-4 max-w-[480px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-purple-700 font-bold tracking-wider">⚙ CURRENCY WATCH · JUST RAN</span>
      </div>
      <p className="text-[12px] text-text-primary mb-3">
        <span className="font-semibold">{card.concepts_scanned}</span> sources checked ·{' '}
        <span className="font-semibold text-purple-700">{notifications.length}</span> need your attention
      </p>

      {breaking.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {breaking.map((v, i) => (
            <div key={i} className="px-3 py-2 rounded-lg bg-red-50 border border-red-200">
              <div className="flex items-start gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[8px] font-bold tracking-wider shrink-0">BREAKING</span>
                <span className="text-[12px] font-semibold text-text-primary leading-tight">{v.concept_name}</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-snug mt-1">{v.summary}</p>
            </div>
          ))}
        </div>
      )}

      {substantive.length > 0 && (
        <div className="space-y-1.5 mb-2">
          {substantive.map((v, i) => (
            <div key={i} className="px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold tracking-wider shrink-0">SUBSTANTIVE</span>
                <span className="text-[12px] font-semibold text-text-primary leading-tight">{v.concept_name}</span>
              </div>
              <p className="text-[11px] text-gray-600 leading-snug mt-1">{v.summary}</p>
            </div>
          ))}
        </div>
      )}

      {noChange.length > 0 && (
        <p className="text-[10px] text-gray-400 mt-2 italic">
          ✓ {noChange.length} other source{noChange.length > 1 ? 's' : ''} unchanged or only cosmetic edits — silently absorbed.
        </p>
      )}

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-purple-100">
        <span className="text-[9px] text-gray-400">Powered by</span>
        <ModeBadge mode={card.modes?.computer} label="Perplexity Computer" />
        <ModeBadge mode={card.modes?.classifier} label="Claude" />
      </div>
    </div>
  );
}

function CareerDigestCard({ card, onAction }) {
  const signals = card.signals || [];

  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/40 to-white p-4 max-w-[480px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-purple-700 font-bold tracking-wider">⚙ CAREER COMPASS · WEEKLY DIGEST</span>
      </div>
      <p className="text-[12px] text-text-primary mb-3">
        <span className="font-semibold">{card.signals_count}</span> signals for{' '}
        <span className="font-semibold text-purple-700">{card.target_role}</span> ·{' '}
        {card.signals_by_type?.role_skill_shift || 0} role · {card.signals_by_type?.new_course || 0} courses ·{' '}
        {card.signals_by_type?.vendor_cert || 0} certs
      </p>

      <div className="space-y-1.5">
        {signals.slice(0, 5).map((s, i) => {
          const typeBadge = {
            role_skill_shift: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'role' },
            new_course: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'course' },
            vendor_cert: { bg: 'bg-green-100', text: 'text-green-800', label: 'cert' },
          }[s.signal_type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: s.signal_type };
          return (
            <div key={i} className="px-3 py-2 rounded-lg bg-white border border-purple-100">
              <div className="flex items-start gap-2 mb-0.5">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider shrink-0 ${typeBadge.bg} ${typeBadge.text}`}>
                  {typeBadge.label}
                </span>
                <span className="text-[12px] font-semibold text-text-primary leading-tight flex-1">
                  {s.title}
                </span>
                <span className="text-[9px] text-purple-600 font-mono shrink-0">
                  {(s.relevance_score * 100).toFixed(0)}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 leading-snug mt-1">{s.body}</p>
            </div>
          );
        })}
      </div>

      {signals.length > 5 && (
        <p className="text-[10px] text-gray-400 mt-2 italic">+ {signals.length - 5} more signals</p>
      )}

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-purple-100">
        <span className="text-[9px] text-gray-400">Powered by</span>
        <ModeBadge mode={card.modes?.computer} label="Perplexity Computer" />
      </div>
    </div>
  );
}

function PredigestCard({ card, onAction }) {
  const concepts = card.key_concepts || [];
  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/40 to-white p-4 max-w-[480px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-purple-700 font-bold tracking-wider">⚙ PRE-DIGESTED · DEEP READ</span>
      </div>
      <p className="text-[13px] font-semibold text-text-primary leading-tight">{card.title}</p>
      <p className="text-[10px] text-gray-400 mt-0.5 truncate">{card.source_domain}</p>

      <div className="mt-3 px-3 py-2 rounded-lg bg-white/70 border border-purple-100">
        <p className="text-[10px] text-purple-700 font-bold tracking-wider mb-1">TL;DR</p>
        <p className="text-[12px] text-text-primary leading-snug">{card.tldr}</p>
      </div>

      <div className="mt-3">
        <p className="text-[10px] text-gray-400 font-bold tracking-wider mb-1.5">
          {concepts.length} KEY CONCEPTS
          {card.reading_time_saved_minutes && (
            <span className="text-purple-600 normal-case font-normal ml-2">
              · saves you ~{card.reading_time_saved_minutes} min
            </span>
          )}
        </p>
        <div className="space-y-1.5">
          {concepts.map((c, i) => (
            <div key={i} className="px-3 py-2 rounded-lg bg-white border border-purple-100">
              <div className="flex items-start gap-2 mb-0.5">
                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[8px] font-bold tracking-wider shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[12px] font-semibold text-text-primary leading-tight flex-1">
                  {c.name}
                </span>
                {c.importance != null && (
                  <span className="text-[9px] text-purple-600 font-mono shrink-0">
                    {(c.importance * 100).toFixed(0)}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-600 leading-snug mt-1">{c.body}</p>
            </div>
          ))}
        </div>
      </div>

      {card.suggested_next_step && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-navy/5 border border-navy/20">
          <p className="text-[10px] text-navy font-bold tracking-wider mb-0.5">SUGGESTED NEXT STEP</p>
          <p className="text-[12px] text-text-primary leading-snug">{card.suggested_next_step}</p>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-purple-100">
        <span className="text-[9px] text-gray-400">Powered by</span>
        <ModeBadge mode={card.modes?.computer} label="Perplexity Computer" />
        <ModeBadge mode={card.modes?.classifier} label="Claude" />
      </div>
    </div>
  );
}


function GoalsDashboardCard({ card, onAction }) {
  const goals = card.goals || [];
  return (
    <div className="rounded-2xl border border-navy/20 bg-white p-4 max-w-[520px]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] text-navy font-bold tracking-wider">🎯 MY GOALS — {card.goal_count || goals.length} ACTIVE</span>
      </div>
      <div className="space-y-2.5">
        {goals.map((g) => {
          const priority = g.priority || "primary";
          const badgeColor = priority === "primary" ? "bg-navy text-gold" : priority === "assigned" ? "bg-blue-600 text-white" : "bg-purple-100 text-purple-700";
          return (
            <div key={g.id} className="px-3 py-2.5 rounded-xl border border-gray-100 hover:border-navy/30 transition-colors">
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider ${badgeColor}`}>{priority.toUpperCase()}</span>
                    <p className="text-[13px] font-semibold text-text-primary truncate">{g.name}</p>
                  </div>
                  <p className="text-[10px] text-gray-400">{g.timeline}{g.days_left ? ` · ${g.days_left} days left` : ""}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[16px] font-bold text-navy leading-none">{g.readiness}</p>
                  <p className="text-[8px] text-gray-400 uppercase tracking-wider">readiness</p>
                </div>
              </div>
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                <div className="h-full bg-navy" style={{ width: `${g.path_summary?.progress_pct || 0}%` }} />
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className="text-[10px] text-gray-500">→ Next: <span className="text-text-primary font-medium">{g.path_summary?.current_step_title || "—"}</span></p>
                <p className="text-[10px] font-mono text-navy">{g.path_summary?.progress_pct || 0}% · {g.path_summary?.completed_steps}/{g.path_summary?.total_steps} steps</p>
              </div>
              {g.path_summary?.last_recompute_reason && (
                <div className="mt-2 px-2 py-1.5 rounded bg-gold/5 border border-gold/20">
                  <p className="text-[9px] text-gold font-bold tracking-wider mb-0.5">⚡ LAST PATH ADJUSTMENT</p>
                  <p className="text-[10px] text-text-primary leading-snug">{g.path_summary.last_recompute_reason}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PathUpdateCard({ card, onAction }) {
  const diff = card.diff || {};
  const added = diff.added || [];
  const modified = diff.modified || [];
  return (
    <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50/40 to-white p-4 max-w-[480px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-green-700 font-bold tracking-wider">⚡ PATH ENGINE · AUTO-ADJUSTMENT</span>
      </div>
      <p className="text-[12px] font-semibold text-text-primary leading-snug mb-2">{card.goal_name}</p>
      <div className="px-3 py-2 rounded-lg bg-white border border-green-200">
        <p className="text-[12px] text-text-primary leading-relaxed">{diff.summary}</p>
      </div>
      {added.length > 0 && (
        <div className="mt-3">
          <p className="text-[9px] text-green-700 font-bold tracking-wider mb-1.5">+ INSERTED</p>
          <div className="space-y-1">
            {added.map((s, i) => (
              <div key={i} className="px-2 py-1.5 rounded bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="px-1 py-0.5 rounded bg-green-600 text-white text-[8px] font-bold tracking-wider">{s.step_type || "step"}</span>
                  <span className="text-[12px] font-semibold text-text-primary leading-tight flex-1">{s.title}</span>
                  {s.estimated_minutes && <span className="text-[9px] text-gray-400 font-mono">{s.estimated_minutes}m</span>}
                </div>
                {s.inserted_reason && <p className="text-[10px] text-gray-600 italic mt-0.5">{s.inserted_reason}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {modified.length > 0 && (
        <p className="text-[10px] text-gray-500 mt-2">↻ {modified.length} step{modified.length > 1 ? "s" : ""} modified.</p>
      )}
      {card.path_after && (
        <div className="mt-3 pt-3 border-t border-green-100 flex items-baseline justify-between">
          <p className="text-[10px] text-gray-500">Now on: <span className="text-text-primary font-medium">{card.path_after.current_step_title}</span></p>
          <p className="text-[10px] font-mono text-green-700">{card.path_after.progress_pct}%</p>
        </div>
      )}
      <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-green-100">
        <span className="text-[9px] text-gray-400">Engine:</span>
        <ModeBadge mode={card.mode === "live" ? "live" : "stub"} label="Claude reasoning" />
        <span className="text-[9px] text-gray-400 italic ml-auto">Manual edits are sacred</span>
      </div>
    </div>
  );
}

function SMEMatchCard({ card, onAction }) {
  const matches = card.matches || [];
  const internalCount = card.matches_by_type?.internal || 0;
  const externalCount = card.matches_by_type?.external || 0;
  return (
    <div className="rounded-2xl border border-rose-200 bg-gradient-to-br from-rose-50/40 to-white p-4 max-w-[520px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-rose-700 font-bold tracking-wider">
          🤝 SMEs FOR "{card.topic?.toUpperCase()}"
        </span>
      </div>
      <p className="text-[12px] text-text-primary mb-3">
        <span className="font-semibold">{card.match_count}</span> matches ·
        <span className="text-rose-700 font-mono ml-2">{internalCount} internal</span> ·
        <span className="text-rose-700 font-mono ml-1">{externalCount} external</span>
      </p>
      <div className="space-y-2">
        {matches.map((m) => {
          const isInternal = m.sme_type === "internal";
          const isFree = !m.rate_per_30min || m.rate_per_30min === 0;
          return (
            <div key={m.sme_id} className="px-3 py-2.5 rounded-xl border border-rose-100 bg-white">
              <div className="flex items-start gap-2 mb-1">
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider shrink-0 ${
                  isInternal ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                }`}>
                  {isInternal ? "internal" : "external"}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-text-primary leading-tight">{m.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{m.role}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[10px] font-mono text-rose-700">{(m.match_mastery * 100).toFixed(0)}</p>
                  <p className="text-[8px] text-gray-400 uppercase tracking-wider">mastery</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-1.5">
                <span className={isFree ? "text-green-600 font-semibold" : "text-text-primary font-semibold"}>
                  {isFree ? "Free / kudos" : `$${m.rate_per_30min}/30min`}
                </span>
                <span>·</span>
                <span>★ {m.kudos_score}</span>
                <span>·</span>
                <span>{m.sessions_completed} sessions</span>
              </div>
              <div className="flex items-center justify-between gap-2 mt-2">
                <p className="text-[10px] text-gray-500">Next: <span className="text-text-primary font-medium">{m.next_available}</span></p>
                <button
                  onClick={() => onAction && onAction(`Book ${m.name} for ${card.topic}`)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold ${
                    isInternal ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                >
                  Book
                </button>
              </div>
              {m.bio && <p className="text-[10px] text-gray-500 italic mt-1.5 leading-snug">"{m.bio}"</p>}
            </div>
          );
        })}
      </div>
      <p className="text-[9px] text-gray-400 mt-3 italic">
        Internal SMEs ranked by mastery × recency × opt-in. External by mastery × kudos × availability.
      </p>
    </div>
  );
}

function StayAheadCard({ card, onAction }) {
  const ai = card.ai_resilience || {};
  const risk = card.market_risk || {};
  const bestFit = card.best_fit_roles || [];
  const stretch = card.stretch_roles || [];
  const pivots = card.pivot_options || [];
  const experiences = card.hands_on_experiences || [];

  const aiVulnLevel = ai.vulnerability_level || "unknown";
  const aiVulnTone =
    aiVulnLevel.includes("high")
      ? { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", pill: "bg-red-600 text-white" }
      : aiVulnLevel.includes("medium")
      ? { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", pill: "bg-amber-500 text-white" }
      : { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", pill: "bg-green-600 text-white" };

  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/40 to-white p-4 max-w-[560px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-purple-700 font-bold tracking-wider">⚙ STAY AHEAD · AI-RESILIENCE + MOBILITY</span>
      </div>

      {/* AI-Resilience — the deepest WHY for Stay Ahead */}
      {ai.headline && (
        <div className={`px-3 py-2.5 rounded-lg mb-3 ${aiVulnTone.bg} border ${aiVulnTone.border}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${aiVulnTone.pill}`}>
              🤖 AI VULNERABILITY · {aiVulnLevel.toUpperCase()}
            </span>
            {ai.vulnerability_score != null && (
              <span className={`text-[10px] font-mono ${aiVulnTone.text}`}>
                {(ai.vulnerability_score * 100).toFixed(0)}/100
              </span>
            )}
          </div>
          <p className="text-[12px] text-text-primary leading-snug">{ai.headline}</p>

          {ai.ai_replaced_today?.length > 0 && (
            <div className="mt-2.5 px-2.5 py-1.5 rounded bg-white/70 border border-gray-100">
              <p className="text-[9px] text-gray-500 font-bold tracking-wider mb-1">⚠ TASKS AI ALREADY DOES (don't define yourself by these)</p>
              <ul className="text-[10px] text-text-primary space-y-0.5">
                {ai.ai_replaced_today.map((t, i) => <li key={i}>· {t}</li>)}
              </ul>
            </div>
          )}

          {ai.ai_amplified_skills?.length > 0 && (
            <div className="mt-1.5 px-2.5 py-1.5 rounded bg-white/70 border border-gray-100">
              <p className="text-[9px] text-green-700 font-bold tracking-wider mb-1">✓ SKILLS AI AMPLIFIES (you keep these and become more valuable)</p>
              <ul className="text-[10px] text-text-primary space-y-0.5">
                {ai.ai_amplified_skills.map((s, i) => <li key={i}>· {s}</li>)}
              </ul>
            </div>
          )}

          {ai.up_the_stack_moves?.length > 0 && (
            <div className="mt-1.5 px-2.5 py-1.5 rounded bg-white/70 border border-purple-200">
              <p className="text-[9px] text-purple-700 font-bold tracking-wider mb-1">↑ MOVES UP THE AI STACK (be the architect, not the replaced)</p>
              <div className="space-y-1.5">
                {ai.up_the_stack_moves.map((m, i) => (
                  <div key={i}>
                    <p className="text-[11px] font-semibold text-text-primary">{m.title}</p>
                    <p className="text-[10px] text-gray-600 leading-snug">{m.what}</p>
                    {m.concrete_step && <p className="text-[10px] text-purple-700 italic mt-0.5">→ {m.concrete_step}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {ai.ai_resilient_pivots?.length > 0 && (
            <div className="mt-1.5 px-2.5 py-1.5 rounded bg-white/70 border border-blue-200">
              <p className="text-[9px] text-blue-700 font-bold tracking-wider mb-1">🌊 AI-RESILIENT PIVOTS (where AI is a tailwind, not a headwind)</p>
              <div className="space-y-1">
                {ai.ai_resilient_pivots.map((p, i) => (
                  <div key={i}>
                    <p className="text-[11px] font-semibold text-text-primary">{p.role}</p>
                    <p className="text-[10px] text-gray-600 leading-snug">{p.rationale}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ai.what_to_avoid?.length > 0 && (
            <div className="mt-1.5 px-2.5 py-1.5 rounded bg-white/70 border border-gray-200">
              <p className="text-[9px] text-gray-500 font-bold tracking-wider mb-1">✗ WHAT TO AVOID</p>
              <ul className="text-[10px] text-text-primary space-y-0.5">
                {ai.what_to_avoid.map((w, i) => <li key={i}>· {w}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {risk.signal && (
        <div className={`px-3 py-2 rounded-lg mb-3 ${risk.tone === "amber" ? "bg-amber-50 border border-amber-200" : risk.tone === "red" ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
          <p className={`text-[10px] font-bold tracking-wider mb-0.5 ${risk.tone === "amber" ? "text-amber-700" : risk.tone === "red" ? "text-red-700" : "text-green-700"}`}>
            ⚠ MARKET RISK · {(risk.level || "unknown").toUpperCase()}
          </p>
          <p className="text-[11px] text-text-primary leading-snug">{risk.signal}</p>
        </div>
      )}

      {bestFit.length > 0 && (
        <Section title="🎯 BEST-FIT ROLES (apply today)" tone="green">
          {bestFit.map((r, i) => <RoleRow key={i} r={r} />)}
        </Section>
      )}

      {stretch.length > 0 && (
        <Section title="📈 STRETCH ROLES (close + 1-2 gaps)" tone="amber">
          {stretch.map((r, i) => <RoleRow key={i} r={r} extra={r.path_to_ready && <p className="text-[10px] text-amber-700 italic mt-1">⏱ {r.path_to_ready}</p>} />)}
        </Section>
      )}

      {pivots.length > 0 && (
        <Section title="🔄 PIVOT OPTIONS (transferable skills)" tone="blue">
          {pivots.map((r, i) => <RoleRow key={i} r={r} extra={r.transferable_skills && <p className="text-[10px] text-blue-700 italic mt-1">↗ Transferable: {r.transferable_skills.join(" · ")}</p>} />)}
        </Section>
      )}

      {experiences.length > 0 && (
        <Section title="🛠 HANDS-ON EXPERIENCES (build the credentials)" tone="purple">
          {experiences.map((e, i) => (
            <div key={i} className="px-3 py-2 rounded-lg border border-purple-100 bg-white mb-1.5">
              <div className="flex items-start gap-2">
                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wider shrink-0 bg-purple-100 text-purple-800">{e.kind}</span>
                <p className="text-[12px] font-semibold text-text-primary leading-tight flex-1">{e.title}</p>
                <span className="text-[9px] font-mono text-purple-700 shrink-0">{(e.fit_score * 100).toFixed(0)}</span>
              </div>
              {e.adds_to_resume && <p className="text-[10px] text-text-primary mt-1.5"><span className="font-semibold">Adds:</span> {e.adds_to_resume}</p>}
              {e.how_to_get_it && <p className="text-[10px] text-gray-600 italic mt-0.5"><span className="font-semibold not-italic text-gray-700">How:</span> {e.how_to_get_it}</p>}
            </div>
          ))}
        </Section>
      )}

      {card.summary && (
        <div className="mt-3 px-3 py-2 rounded-lg bg-navy/5 border border-navy/20">
          <p className="text-[10px] text-navy font-bold tracking-wider mb-0.5">SUMMARY</p>
          <p className="text-[11px] text-text-primary leading-snug">{card.summary}</p>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-purple-100">
        <span className="text-[9px] text-gray-400">Powered by</span>
        <ModeBadge mode={card.modes?.computer} label="Perplexity Computer" />
        <ModeBadge mode={card.modes?.classifier} label="Claude" />
      </div>
    </div>
  );
}

function Section({ title, tone, children }) {
  const headColor = { green: "text-green-700", amber: "text-amber-700", blue: "text-blue-700", purple: "text-purple-700" }[tone] || "text-gray-600";
  return (
    <div className="mb-3">
      <p className={`text-[9px] font-bold tracking-wider mb-1.5 ${headColor}`}>{title}</p>
      {children}
    </div>
  );
}

function RoleRow({ r, extra }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-gray-200 bg-white mb-1.5">
      <div className="flex items-start gap-2">
        <p className="text-[12px] font-semibold text-text-primary leading-tight flex-1">{r.title} <span className="text-gray-400 font-normal">@ {r.company}</span></p>
        <span className="text-[9px] font-mono text-purple-700 shrink-0">{(r.match_score * 100).toFixed(0)}</span>
      </div>
      {r.salary_range && <p className="text-[10px] text-gray-500 mt-0.5">{r.salary_range}{r.location ? ` · ${r.location}` : ""}</p>}
      {r.match_reason && <p className="text-[10px] text-text-primary mt-1"><span className="font-semibold">Why match:</span> {r.match_reason}</p>}
      {r.why_apply && <p className="text-[10px] text-gray-600 italic mt-0.5">{r.why_apply}</p>}
      {r.why_pivot && <p className="text-[10px] text-gray-600 italic mt-0.5">{r.why_pivot}</p>}
      {extra}
    </div>
  );
}

function ScenarioSimulationCard({ card, onAction }) {
  const projections = card.projections || [];
  return (
    <div className="rounded-2xl border border-purple-200 bg-gradient-to-br from-purple-50/40 to-white p-4 max-w-[640px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-purple-700 font-bold tracking-wider">🔮 CAREER SCENARIO SIMULATION</span>
      </div>
      <p className="text-[11px] text-text-primary mb-3 leading-snug">{card.comparison_summary}</p>

      <div className="space-y-3">
        {projections.map((p, i) => (
          <div key={i} className="border border-purple-100 rounded-lg overflow-hidden">
            <div className="px-3 py-2 bg-purple-50/60">
              <p className="text-[12px] font-bold text-text-primary leading-tight">{p.name}</p>
              <p className="text-[10px] text-purple-700 mt-0.5">{p.headline}</p>
              <p className="text-[10px] text-gray-500 mt-0.5">{p.effort_hours_per_week} hrs/wk · {p.horizon_months} months</p>
            </div>
            <div className="px-3 py-2 bg-white">
              {p.outcomes?.map((o, j) => (
                <div key={j} className="mb-2 last:mb-0">
                  <p className="text-[9px] text-gray-400 font-bold tracking-wider mb-1">AT {o.milestone_at_months} MONTHS</p>
                  {o.mid_outcome && (
                    <div className="px-2 py-1.5 rounded bg-purple-50 border border-purple-200 mb-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[11px] font-semibold text-text-primary truncate">[mid · {(o.mid_outcome.probability * 100).toFixed(0)}%] {o.mid_outcome.role}</p>
                        <p className="text-[10px] font-mono text-purple-700 shrink-0">{o.mid_outcome.comp}</p>
                      </div>
                      <p className="text-[9px] text-gray-600 italic mt-0.5">{o.mid_outcome.note}</p>
                    </div>
                  )}
                  {o.high_outcome && (
                    <div className="px-2 py-1 mb-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[10px] text-green-700">[high · {(o.high_outcome.probability * 100).toFixed(0)}%] {o.high_outcome.role}</p>
                        <p className="text-[9px] font-mono text-gray-500 shrink-0">{o.high_outcome.comp}</p>
                      </div>
                    </div>
                  )}
                  {o.low_outcome && (
                    <div className="px-2 py-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="text-[10px] text-amber-700">[low · {(o.low_outcome.probability * 100).toFixed(0)}%] {o.low_outcome.role}</p>
                        <p className="text-[9px] font-mono text-gray-500 shrink-0">{o.low_outcome.comp}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {p.required_experiences?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-100">
                  <p className="text-[9px] text-purple-700 font-bold tracking-wider mb-1">REQUIRED</p>
                  <ul className="text-[10px] text-text-primary space-y-0.5">
                    {p.required_experiences.map((e, k) => <li key={k}>· {e}</li>)}
                  </ul>
                </div>
              )}
              {p.risk_markers?.length > 0 && (
                <div className="mt-2 pt-2 border-t border-purple-100">
                  <p className="text-[9px] text-amber-700 font-bold tracking-wider mb-1">RISKS</p>
                  <ul className="text-[10px] text-gray-600 space-y-0.5">
                    {p.risk_markers.map((r, k) => <li key={k}>⚠ {r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-purple-100">
        <span className="text-[9px] text-gray-400">Engine:</span>
        <ModeBadge mode={card.modes?.engine} label="Claude reasoning" />
        <span className="text-[9px] text-gray-400 italic ml-auto">Probabilities are projections — your effort changes them</span>
      </div>
    </div>
  );
}

function JournalAddedCard({ card, onAction }) {
  const e = card.entry || {};
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white p-4 max-w-[480px]">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] text-emerald-700 font-bold tracking-wider">📋 ADDED TO YOUR SERVICE RECORD</span>
        <span className="text-[9px] text-gray-400 ml-auto">Journal: {card.journal_size} entries</span>
      </div>
      <p className="text-[13px] font-semibold text-text-primary leading-tight">{e.title}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{e.date} · {e.category}</p>
      {e.outcomes?.length > 0 && (
        <div className="mt-2.5 px-2.5 py-1.5 rounded bg-white border border-emerald-100">
          <p className="text-[9px] text-emerald-700 font-bold tracking-wider mb-1">OUTCOMES</p>
          <ul className="text-[11px] text-text-primary space-y-0.5">
            {e.outcomes.map((o, i) => <li key={i}>· {o}</li>)}
          </ul>
        </div>
      )}
      {e.technologies?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {e.technologies.map((t, i) => (
            <span key={i} className="px-1.5 py-0.5 rounded bg-gray-100 text-[9px] text-gray-700 font-mono">{t}</span>
          ))}
        </div>
      )}
      {e.transferable_skills?.length > 0 && (
        <p className="text-[10px] text-emerald-700 italic mt-2">Tagged skills: {e.transferable_skills.join(' · ')}</p>
      )}
      <p className="text-[9px] text-gray-400 italic mt-2">When you next paste a job posting, this entry will be considered for inclusion in your tailored resume.</p>
    </div>
  );
}

function TailoredResumeCard({ card, onAction }) {
  const projects = card.highlighted_projects || [];
  const outcomes = card.key_outcomes_to_emphasize || [];
  const tech = card.relevant_tech || [];
  const skills = card.transferable_skills || [];
  const gaps = card.gaps_vs_job || [];
  const emphasis = card.experiences_to_emphasize || [];
  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50/40 to-white p-4 max-w-[600px]">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] text-emerald-700 font-bold tracking-wider">📋 TAILORED RESUME</span>
        <span className="ml-auto px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold tracking-wider">
          {Math.round((card.match_score || 0) * 100)}% MATCH
        </span>
      </div>
      <p className="text-[13px] font-semibold text-text-primary leading-tight">{card.job_title}</p>
      <p className="text-[10px] text-gray-500 mb-3">@ {card.job_company}{card.job_url ? ` · ${card.job_url.slice(0, 60)}…` : ''}</p>

      <div className="px-3 py-2 rounded-lg bg-white border border-emerald-100 mb-3">
        <p className="text-[9px] text-emerald-700 font-bold tracking-wider mb-1">SUMMARY</p>
        <p className="text-[11px] text-text-primary leading-snug">{card.tailored_summary}</p>
      </div>

      <div className="mb-3">
        <p className="text-[9px] text-emerald-700 font-bold tracking-wider mb-1.5">HIGHLIGHTED PROJECTS (from your service record)</p>
        <div className="space-y-1.5">
          {projects.map((p, i) => (
            <div key={i} className="px-3 py-2 rounded bg-white border border-emerald-100">
              <div className="flex items-baseline justify-between gap-2 mb-0.5">
                <p className="text-[12px] font-semibold text-text-primary leading-tight flex-1">{p.title}</p>
                <span className="text-[9px] font-mono text-emerald-700 shrink-0">{Math.round(p.match_score * 100)}</span>
              </div>
              <p className="text-[10px] text-gray-400">{p.date} · {p.category}</p>
              {p.outcomes?.length > 0 && (
                <ul className="text-[10px] text-text-primary mt-1 space-y-0.5">
                  {p.outcomes.slice(0, 2).map((o, j) => <li key={j}>· {o}</li>)}
                </ul>
              )}
              {p.match_reason && <p className="text-[10px] text-emerald-700 italic mt-1">↳ {p.match_reason}</p>}
            </div>
          ))}
        </div>
      </div>

      {outcomes.length > 0 && (
        <div className="mb-3 px-3 py-2 rounded bg-white border border-emerald-100">
          <p className="text-[9px] text-emerald-700 font-bold tracking-wider mb-1">KEY OUTCOMES TO EMPHASIZE (recruiters skim for these)</p>
          <ul className="text-[10px] text-text-primary space-y-0.5">
            {outcomes.map((o, i) => <li key={i}>· {o}</li>)}
          </ul>
        </div>
      )}

      {tech.length > 0 && (
        <div className="mb-2">
          <p className="text-[9px] text-gray-500 font-bold tracking-wider mb-1">RELEVANT TECH</p>
          <div className="flex flex-wrap gap-1">
            {tech.map((t, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono">{t}</span>
            ))}
          </div>
        </div>
      )}

      {skills.length > 0 && (
        <div className="mb-3">
          <p className="text-[9px] text-gray-500 font-bold tracking-wider mb-1">TRANSFERABLE SKILLS</p>
          <div className="flex flex-wrap gap-1">
            {skills.map((s, i) => (
              <span key={i} className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 text-[9px]">{s}</span>
            ))}
          </div>
        </div>
      )}

      {gaps.length > 0 && (
        <div className="mb-2 px-3 py-2 rounded bg-amber-50 border border-amber-200">
          <p className="text-[9px] text-amber-700 font-bold tracking-wider mb-1">⚠ GAPS vs THIS JOB (work on these to strengthen your fit)</p>
          <ul className="text-[10px] text-text-primary space-y-0.5">
            {gaps.map((g, i) => <li key={i}>· {g}</li>)}
          </ul>
        </div>
      )}

      {emphasis.length > 0 && (
        <div className="mb-2 px-3 py-2 rounded bg-navy/5 border border-navy/20">
          <p className="text-[9px] text-navy font-bold tracking-wider mb-1">📝 RESUME-WRITING TIPS</p>
          <ul className="text-[10px] text-text-primary space-y-0.5">
            {emphasis.map((e, i) => <li key={i}>· {e}</li>)}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-emerald-100">
        <span className="text-[9px] text-gray-400">Powered by</span>
        <ModeBadge mode={card.modes?.computer} label="Perplexity Computer" />
        <ModeBadge mode={card.modes?.classifier} label="Claude" />
        <span className="text-[9px] text-gray-400 italic ml-auto">Drawn from your living service record</span>
      </div>
    </div>
  );
}
