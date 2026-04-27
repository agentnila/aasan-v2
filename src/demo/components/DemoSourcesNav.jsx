import { navigate } from '../DemoApp'

const sources = [
  { name: 'Coursera', icon: 'C', color: 'bg-blue-500', items: 2400 },
  { name: 'LinkedIn Learning', icon: 'in', color: 'bg-blue-700', items: 1800 },
  { name: 'Confluence', icon: 'C', color: 'bg-blue-400', items: 340 },
  { name: 'Google Drive', icon: 'G', color: 'bg-green-500', items: 125 },
  { name: 'YouTube', icon: '▶', color: 'bg-red-500', items: 89 },
  { name: 'Company LMS', icon: 'L', color: 'bg-navy', items: 560 },
]

/**
 * Visual-only left rail for demo. Same look as the real SourcesNav,
 * minus Clerk hooks and dev-only features. Adds a "🎯 My Goals" button
 * that jumps to the Goals Dashboard scenario.
 */
export default function DemoSourcesNav({ activeGoalId = 1, goalCount = 3 }) {
  return (
    <nav className="w-[260px] min-w-[260px] bg-white border-r border-gray-100 flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center shadow-sm border border-navy/20">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gold">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 10c0 0 2.5-0.5 5 0.5v6c-2.5-1-5-0.5-5-0.5v-6z" fill="currentColor" opacity="0.3" />
              <path d="M17 10c0 0-2.5-0.5-5 0.5v6c2.5-1 5-0.5 5-0.5v-6z" fill="currentColor" opacity="0.3" />
              <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h2 className="font-serif text-[14px] font-bold text-navy tracking-tight">Aasan</h2>
            <p className="text-[8px] text-gray-400 tracking-[0.15em] uppercase">Est. 2026 · Personal University</p>
          </div>
        </div>
      </div>

      {/* My Goals — primary nav */}
      <div className="px-4 py-3 border-b border-gray-50">
        <button
          onClick={() => navigate('/demo/goals-dashboard')}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-navy/5 hover:bg-navy/10 transition-colors group"
        >
          <span className="text-[18px]">🎯</span>
          <div className="flex-1 text-left">
            <p className="text-[12px] font-semibold text-navy">My Goals</p>
            <p className="text-[10px] text-gray-500">Multi-goal dashboard</p>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy text-white font-bold">
            {goalCount}
          </span>
        </button>
      </div>

      {/* Active goal context */}
      <div className="px-4 py-3 border-b border-gray-50">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">ACTIVE GOAL</p>
        <div className="px-3 py-2.5 rounded-lg bg-gradient-to-br from-navy to-[#0f2a52] text-white">
          <p className="text-[11px] font-semibold">Cloud Architect</p>
          <p className="text-[9px] text-white/60 mt-0.5">Q4 2026 · 192 days left</p>
          <div className="h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-gold" style={{ width: '42%' }} />
          </div>
          <p className="text-[9px] text-white/70 mt-1">42% · Step 6 of 12</p>
        </div>
      </div>

      {/* Connected sources */}
      <div className="px-4 py-4 border-b border-gray-50">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2.5">
          CONNECTED SOURCES · {sources.length}
        </p>
        <div className="flex flex-col gap-1.5">
          {sources.map((source) => (
            <div
              key={source.name}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-default"
            >
              <div className={`w-7 h-7 rounded-md ${source.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                {source.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-text-primary truncate">{source.name}</p>
                <p className="text-[9px] text-gray-400">{source.items.toLocaleString()} items</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Agent Bridge status */}
      <div className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-2 px-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-gold opacity-50"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-gold"></span>
          </span>
          <p className="text-[10px] text-gold font-semibold tracking-wider">⚡ AGENT BRIDGE CONNECTED</p>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 px-2">Peraasan can read web pages on your behalf</p>
      </div>

      {/* Account at bottom */}
      <div className="mt-auto px-4 py-3 border-t border-gray-50">
        <div className="flex items-center gap-2.5 px-2.5 py-2">
          <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-gold text-[10px] font-bold">
            SC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-medium text-text-primary truncate">Sarah Chen</p>
            <p className="text-[9px] text-gray-400">Senior SWE · Platform</p>
          </div>
        </div>
      </div>
    </nav>
  )
}
