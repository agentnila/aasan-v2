import { scenarios } from './scenarios'
import { navigate } from './DemoApp'

export default function DemoLanding({ notFound }) {
  return (
    <div className="min-h-screen w-screen bg-[#fbf9f4] overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 pt-10 pb-8">
        {/* Hero — centered, classical */}
        <div className="text-center">
          {/* Crest */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center shadow-md border border-navy/20 mx-auto">
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" className="text-gold">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 10c0 0 2.5-0.5 5 0.5v6c-2.5-1-5-0.5-5-0.5v-6z" fill="currentColor" opacity="0.3" />
              <path d="M17 10c0 0-2.5-0.5-5 0.5v6c2.5-1 5-0.5 5-0.5v-6z" fill="currentColor" opacity="0.3" />
              <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
          </div>

          {/* Aasan + tagline */}
          <h1 className="font-serif text-5xl font-bold text-navy tracking-tight mt-4">Aasan</h1>
          <p className="text-[10px] text-gold tracking-[0.3em] uppercase mt-2 font-semibold">
            Est. 2026 · Your Personal University
          </p>

          {/* Gold rule */}
          <div className="w-12 h-px bg-gold/60 mx-auto my-6" />

          {/* Mission line */}
          <h2 className="font-serif text-3xl text-text-primary italic leading-snug max-w-2xl mx-auto">
            Helps you learn. Learns with you.<br />
            Remembers what you know — for life.
          </h2>
          <p className="text-[13px] text-gray-500 mt-3 max-w-xl mx-auto leading-relaxed">
            The AI learning agent for enterprises. Finds the right content from every source your company has, teaches in conversation, and keeps your knowledge current as the world changes.
          </p>
        </div>

        {/* Triptych — 3 benefits in classical layout */}
        <div className="mt-10 grid md:grid-cols-3 gap-x-8 gap-y-6">
          {[
            {
              numeral: 'I.',
              title: 'Less hunting,\nmore learning.',
              body: 'Peraasan finds the right content from every source your company has — Coursera, the LMS, your team\'s wiki, the open web — and sequences it into a path tailored to your goal.',
            },
            {
              numeral: 'II.',
              title: 'Captured\nforever.',
              body: 'Every concept you pick up enters your personal knowledge graph. Spaced review keeps it sharp. Years from now, it\'s still yours — portable, verifiable, never lost.',
            },
            {
              numeral: 'III.',
              title: 'Always\ncurrent.',
              body: 'When APIs deprecate or your team\'s runbook is rewritten, Peraasan tells you exactly what changed and serves the refresher. Your knowledge stays true.',
            },
          ].map((b) => (
            <div key={b.numeral} className="text-center md:text-left px-1">
              <p className="font-serif text-2xl text-gold">{b.numeral}</p>
              <h3 className="font-serif text-xl font-bold text-navy mt-1 leading-tight whitespace-pre-line">
                {b.title}
              </h3>
              <p className="text-[13px] text-gray-600 leading-relaxed mt-3">{b.body}</p>
            </div>
          ))}
        </div>

        {/* Walk-through prompt */}
        <div className="mt-12 mb-6 text-center">
          <div className="flex items-center justify-center gap-3 text-[10px] text-gray-400 tracking-[0.25em] uppercase font-semibold">
            <span className="w-8 h-px bg-gray-300" />
            <span>The story · 10 scenarios · ~15 minutes</span>
            <span className="w-8 h-px bg-gray-300" />
          </div>
          <p className="text-sm text-gray-500 mt-3 max-w-xl mx-auto leading-relaxed">
            Each scenario shows Peraasan acting <em>for</em> the learner. Watch for the gold <span className="text-gold font-semibold">⚡ agentic moments</span>.
          </p>
        </div>

        {notFound && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Scenario "<code className="font-mono">{notFound}</code>" not found. Pick one below.
          </div>
        )}

        {/* Scenario grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => navigate(`/demo/${s.slug}`)}
              className="text-left bg-white border border-gray-100 rounded-xl p-5 hover:border-navy/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-navy/5 flex items-center justify-center text-navy font-serif font-bold shrink-0 group-hover:bg-navy group-hover:text-gold transition-colors">
                  {s.id}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-text-primary text-[15px] leading-tight">{s.title}</h3>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">{s.persona}</p>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{s.summary}</p>
                  <p className="text-[12px] text-gold mt-2 font-medium">⚡ {s.agentic}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            This is an interactive wireframe. No real API calls. Pre-canned data only. Built to gather feedback.
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Aasan V2 · Built with Claude (Anthropic) · {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
