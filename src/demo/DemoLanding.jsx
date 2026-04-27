import { scenarios } from './scenarios'
import { navigate } from './DemoApp'

export default function DemoLanding({ notFound }) {
  return (
    <div className="min-h-screen w-screen bg-gradient-to-br from-bg via-white to-columbia-blue/20 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center shadow-md border border-navy/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gold">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 10c0 0 2.5-0.5 5 0.5v6c-2.5-1-5-0.5-5-0.5v-6z" fill="currentColor" opacity="0.3" />
              <path d="M17 10c0 0-2.5-0.5-5 0.5v6c2.5-1 5-0.5 5-0.5v-6z" fill="currentColor" opacity="0.3" />
              <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-navy tracking-tight">Aasan</h1>
            <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase">Your Personal University · Interactive Demo</p>
          </div>
        </div>

        <div className="mt-6 mb-10 max-w-2xl">
          <h2 className="text-3xl font-serif text-text-primary leading-tight mb-4">
            Aasan helps you learn.<br />
            Learns <span className="italic">with</span> you.<br />
            Keeps track of everything you've learnt.
          </h2>
          <p className="text-gray-600 leading-relaxed">
            It's an AI learning agent for enterprises. It finds the right content for your goal across every source your company has — Coursera, the LMS, Confluence, the open web — sequences it into a path, teaches alongside you in conversation, and captures every concept you pick up into a permanent knowledge graph that's yours forever. As the world changes — APIs deprecate, runbooks get updated — Aasan keeps your knowledge fresh.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mt-3">
            The 10 scenarios below walk through how it works. Click any one. The narrator panel on the right of each scene tells the story — watch for the gold <span className="text-gold font-semibold">⚡ agentic moments</span>.
          </p>
        </div>

        {notFound && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            Scenario "<code className="font-mono">{notFound}</code>" not found. Pick one below.
          </div>
        )}

        {/* The agentic story arc */}
        <div className="mb-3">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-2">THE STORY · 10 SCENARIOS · ~15 MINUTES</p>
          <p className="text-sm text-gray-500 mb-6">
            Each scenario shows Peraasan acting <em>for</em> the learner — not just answering questions. Watch for the <span className="text-gold font-semibold">⚡ agentic moments</span>.
          </p>
        </div>

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
