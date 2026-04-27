import MessageBubble from './MessageBubble'
import DemoSourcesNav from './DemoSourcesNav'
import DemoContextPanel from './DemoContextPanel'

/**
 * Generic 3-panel chat scene used across most scenarios.
 * Receives `messages` (array up to current scene), `context` (right panel data),
 * `inputDraft` (what the learner is "typing" — pre-filled), `agentActive`
 * (renders the live ⚡ agent indicator on top of the input).
 */
export default function ChatScene({
  messages,
  context,
  inputDraft,
  agentActive,
  agentLabel,
  navOverride, // optional — replace SourcesNav with a different left panel (e.g., Goals nav)
}) {
  return (
    <div className="flex h-full w-full bg-bg overflow-hidden">
      {navOverride || <DemoSourcesNav />}

      {/* Center: chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-gray-300 text-sm italic">
              (chat empty — first message coming up)
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 bg-white px-6 py-3">
          {agentActive && (
            <div className="mb-2 flex items-center gap-2 text-[11px]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold"></span>
              </span>
              <span className="text-gold font-semibold">{agentLabel || 'Peraasan is acting…'}</span>
            </div>
          )}
          <div className="flex items-end gap-2">
            <div className="flex-1 min-h-[44px] max-h-[120px] px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-[13px] text-text-primary">
              {inputDraft || (
                <span className="text-gray-400">Ask Peraasan anything, or paste a URL for it to read…</span>
              )}
            </div>
            <button className="w-10 h-10 rounded-xl bg-navy text-white flex items-center justify-center shrink-0 hover:bg-navy/90">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <DemoContextPanel data={context} />
    </div>
  )
}
