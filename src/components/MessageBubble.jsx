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

