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
            Your Career Operating System
          </p>

          {/* Gold rule */}
          <div className="w-12 h-px bg-gold/60 mx-auto my-6" />

          {/* The unified question — V3 hero */}
          <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase font-semibold mb-3">One question. Answered for you. Personally.</p>
          <h2 className="font-serif text-3xl text-text-primary leading-snug max-w-2xl mx-auto">
            <em>How AI-Resilient is your job?</em>
            <br />
            And how do you stay not just relevant — but <em>desired</em>?
          </h2>

          <p className="text-[13px] text-gray-600 mt-5 max-w-2xl mx-auto leading-relaxed">
            McKinsey publishes aggregates. Aasan answers for <span className="text-text-primary font-semibold">YOU</span> — your role, your skills, your trajectory.
            In a world where AI, inflation, and geopolitics are all reshaping what "employed" means,
            Aasan helps you be better at your <span className="text-text-primary font-semibold">current job</span> and ready for your <span className="text-text-primary font-semibold">next one</span> — through continuous learning. Forever.
          </p>
        </div>

        {/* Triptych — 3 benefits in classical layout */}
        <div className="mt-10 grid md:grid-cols-3 gap-x-8 gap-y-6">
          {[
            {
              numeral: 'I.',
              title: 'Better at your\ncurrent job.',
              body: 'Continuous learning across every source your company has. Knowledge captured forever in your private graph. Spaced review keeps it sharp. Currency Watch keeps it true as the world changes.',
            },
            {
              numeral: 'II.',
              title: 'Ready for\nyour next one.',
              body: 'AI-Resilience score for your role. Best-fit jobs you could land today. Stretch roles with explicit "X weeks to ready" paths. Hands-on experiences (adjunct lecturer · OSS · personal AI project) that build real resume signal.',
            },
            {
              numeral: 'III.',
              title: 'Resilient\nforever.',
              body: 'Living service record built passively through chat. Auto-tailored resume per job posting via Perplexity Computer + Claude. Career scenario planning with probability-ranged outcomes. Insurance against AI, inflation, and the macro forces nobody else helps you navigate.',
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
            <span>The vision · 10 scenarios · ~15 minutes</span>
            <span className="w-8 h-px bg-gray-300" />
          </div>
          <p className="text-sm text-gray-500 mt-3 max-w-xl mx-auto leading-relaxed">
            Each scenario shows Peraasan acting <em>for</em> the learner. Watch for the gold <span className="text-gold font-semibold">⚡ agentic moments</span>.
          </p>
          <p className="text-[12px] text-gray-400 mt-4 max-w-xl mx-auto leading-relaxed italic">
            Want to see the <em>live</em> production app instead? <a href="/" className="text-navy underline hover:text-navy/80">aasan-v2.vercel.app</a> has the 9 working agentic loops — Currency Watch, Career Compass, Stay Ahead, Resume tailor, and more.
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

        {/* The pitch */}
        <div className="mt-12 max-w-3xl mx-auto px-6 py-5 rounded-xl bg-white/60 border border-gray-100">
          <p className="text-[11px] text-gold font-bold tracking-[0.2em] uppercase mb-2">THE PITCH</p>
          <p className="text-[13px] text-text-primary leading-relaxed">
            Big firms publish <em>aggregate</em> predictions about the job market — *"30% of jobs will be AI-augmented by 2030."* True. But unactionable.
          </p>
          <p className="text-[13px] text-text-primary leading-relaxed mt-2">
            Aasan answers the same question for the <em>individual</em>: <span className="font-semibold">YOUR AI-Resilience score, YOUR best-fit jobs, YOUR specific moves to stay desired.</span> That precision is the moat.
          </p>
          <p className="text-[12px] text-gray-500 leading-relaxed mt-2 italic">
            Bloomberg terminal vs. personal financial advisor — both have the same data; only one tells you what to do.
          </p>
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
