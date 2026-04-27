/**
 * Enterprise Learning Warehouse — Maria's view (CLO).
 * The headline scene. Mirrors the individual Goals Dashboard at org scale.
 */
export default function ELWDashboard({ scene = 'overview' }) {
  return (
    <div className="flex h-full w-full bg-bg overflow-hidden">
      {/* Admin nav (different from learner left rail — shows business goals) */}
      <nav className="w-[240px] min-w-[240px] bg-white border-r border-gray-100 flex flex-col py-4 px-3">
        <div className="flex items-center gap-2.5 px-2 mb-6">
          <div className="w-9 h-9 rounded-full bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center shadow-sm border border-navy/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-gold">
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="1.2" />
              <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h2 className="font-serif text-[13px] font-bold text-navy">Aasan Admin</h2>
            <p className="text-[8px] text-gray-400 tracking-[0.15em] uppercase">L&D · TechCorp</p>
          </div>
        </div>

        <div className="px-2 mb-3">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">L&D NAVIGATION</p>
          <NavItem icon="🏛" label="Workforce Capability" active />
          <NavItem icon="🎯" label="Strategic Goals" badge="4" />
          <NavItem icon="📚" label="Content Sources" badge="6" />
          <NavItem icon="📋" label="Assignments" badge="12" />
          <NavItem icon="📊" label="ROI Dashboard" />
          <NavItem icon="⚙️" label="Settings" />
        </div>

        <div className="mt-6 px-2">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">STRATEGIC GOALS</p>
          <BizGoal label="Multi-region platform" date="Q4 2026" readiness={42} active />
          <BizGoal label="SOC 2 Type II" date="Q3 2026" readiness={68} />
          <BizGoal label="Enterprise tier launch" date="Q2 2026" readiness={51} />
          <BizGoal label="AI feature parity" date="Q4 2026" readiness={28} />
        </div>

        <div className="mt-auto px-2 py-2 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 text-[10px] font-bold">
              MR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-text-primary truncate">Maria Rodriguez</p>
              <p className="text-[9px] text-gray-400">Director, L&D</p>
            </div>
          </div>
        </div>
      </nav>

      {/* Main */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-8 py-6">
          {/* Top question */}
          <div className="mb-6">
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider">STRATEGIC GOAL</p>
            <h1 className="font-serif text-2xl font-bold text-text-primary mt-1 leading-tight">
              "Are we ready to ship the multi-region platform by Q4 2026?"
            </h1>
            <p className="text-[12px] text-gray-500 mt-1.5">No CLO can answer this today. Aasan can.</p>
          </div>

          {/* Big readiness number */}
          <div className="bg-gradient-to-br from-navy to-[#0f2a52] text-white rounded-xl p-6 mb-6">
            <p className="text-[10px] text-gold font-semibold tracking-wider">WORKFORCE READINESS · MULTI-REGION PLATFORM Q4</p>
            <div className="flex items-baseline gap-3 mt-2">
              <span className="font-serif text-6xl font-bold">42</span>
              <span className="text-2xl text-white/60">/100</span>
              <span className="ml-3 text-sm text-green-300 font-mono">↑8 in last 30 days</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden mt-3 max-w-md">
              <div className="h-full bg-gold" style={{ width: '42%' }} />
            </div>
            <p className="text-[12px] text-white/70 mt-3 leading-relaxed max-w-2xl">
              Rolled up from <span className="font-semibold text-white">187 employee knowledge graphs</span> in Engineering, SRE, and Platform teams. Verified by mastery + currency. Updated continuously.
            </p>
          </div>

          {/* Capability requirements derived from goal */}
          <div className="grid grid-cols-2 gap-5 mb-6">
            {/* Required vs actual */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">CAPABILITY MAP · REQUIRED VS ACTUAL</p>
              <div className="space-y-3">
                {[
                  { skill: 'K8s Architects (mastery ≥ 0.8)', need: 8, have: 3, gap: 5 },
                  { skill: 'AWS Solutions Architects', need: 6, have: 4, gap: 2 },
                  { skill: 'Site Reliability Engineers', need: 12, have: 9, gap: 3 },
                  { skill: 'Network/Multi-region depth', need: 5, have: 1, gap: 4 },
                  { skill: 'Observability practitioners', need: 8, have: 7, gap: 1 },
                ].map((c) => (
                  <div key={c.skill}>
                    <div className="flex items-center justify-between text-[12px] mb-1">
                      <span className="text-text-primary">{c.skill}</span>
                      <span className="font-mono text-[11px]">
                        <span className="text-text-primary">{c.have}</span>
                        <span className="text-gray-400">/{c.need}</span>
                        {c.gap > 0 && <span className="ml-2 text-amber-600">−{c.gap}</span>}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-navy" style={{ width: `${(c.have / c.need) * 100}%` }} />
                      {c.gap > 0 && <div className="h-full bg-amber-300" style={{ width: `${(c.gap / c.need) * 100}%` }} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Currency health */}
            <div className="bg-white border border-gray-100 rounded-xl p-5">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">CURRENCY HEALTH · ORG-WIDE</p>
              <div className="flex items-baseline gap-2 mb-3">
                <span className="font-serif text-4xl font-bold text-navy">94%</span>
                <span className="text-sm text-gray-400">of org knowledge is current</span>
              </div>
              <div className="space-y-2 text-[11px] mt-3">
                <div className="flex justify-between">
                  <span className="text-text-primary">K8s 1.31 deprecation refresher</span>
                  <span className="text-gray-500"><span className="font-mono text-amber-600">14</span> employees affected · 12 done</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-primary">AWS Lambda runtime nodejs16 deprecation</span>
                  <span className="text-gray-500"><span className="font-mono text-amber-600">23</span> employees affected · 8 done</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-primary">Internal: incident runbook v3.3 update</span>
                  <span className="text-gray-500"><span className="font-mono text-amber-600">31</span> employees notified</span>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-3 italic leading-relaxed">
                ⚡ External Freshness Watcher + Internal Doc Change Monitor running continuously across the org.
              </p>
            </div>
          </div>

          {/* Recommended interventions */}
          <div className="bg-white border border-gray-100 rounded-xl p-5 mb-6">
            <p className="text-[10px] text-gold font-bold tracking-wider mb-1">⚡ AASAN RECOMMENDS · PRIORITIZED INTERVENTIONS</p>
            <p className="text-[12px] text-gray-500 mb-4">To close the gap and hit 80+ readiness by Q4, here\'s the prioritized plan:</p>

            <div className="space-y-3">
              <Intervention
                kind="TRAIN"
                color="bg-green-100 text-green-700"
                title="Upskill 5 senior engineers to K8s architect mastery"
                detail="Identified candidates: Sarah Chen, James Park, Emily Mendez, David Kim, Priya Shah. Each has the adjacent skills + readiness to upskill in 8 weeks. Personalized paths auto-generated. Time investment: ~3h/week per person."
                action="Create 5 personalized paths"
              />
              <Intervention
                kind="HIRE"
                color="bg-blue-100 text-blue-700"
                title="Hire 4 Network/Multi-region engineers"
                detail="Largest gap (-4) with longest training time-to-readiness. Job spec auto-drafted from gap requirements. Suggest opening reqs by end of month."
                action="Open job reqs"
              />
              <Intervention
                kind="MENTOR"
                color="bg-purple-100 text-purple-700"
                title="Pair David Kim with 3 K8s upskillers"
                detail="David is the deepest K8s practitioner already. Pairing with Sarah, James, and Emily during their upskilling will compress time-to-mastery by ~30%. Auto-scheduled via Aasan."
                action="Auto-schedule pairings"
              />
              <Intervention
                kind="CONTRACT"
                color="bg-amber-100 text-amber-700"
                title="Bring on 1 senior multi-region consultant for Q3"
                detail="To bridge the network depth gap while internal hiring + upskilling fills in. 12-week engagement focused on knowledge transfer to upskillers above."
                action="Initiate contract"
              />
            </div>

            <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-[12px] text-text-primary">
                <span className="font-semibold">Projected readiness by Q4:</span> <span className="font-mono text-navy text-lg">82</span>
                <span className="text-gray-400 text-[11px] ml-2">if all interventions execute</span>
              </p>
              <button className="px-4 py-2 rounded-lg bg-navy text-white text-[12px] font-semibold hover:bg-navy/90">
                Approve plan & execute
              </button>
            </div>
          </div>

          {/* Bottom: comparison */}
          <div className="bg-amber-50/40 border border-amber-200 rounded-xl p-5">
            <p className="text-[10px] text-amber-700 font-bold tracking-wider mb-2">⚠ WITHOUT AASAN, MARIA WOULD HAVE</p>
            <ul className="text-[12px] text-text-primary space-y-1">
              <li>• Course completion rates from 6 different platforms (none synthesized)</li>
              <li>• No visibility into actual capability — only "did they click through"</li>
              <li>• A spreadsheet asking each manager to estimate team readiness</li>
              <li>• A board presentation that says "82% of mandatory training was completed" — which doesn\'t answer the strategic question</li>
            </ul>
            <p className="text-[12px] text-amber-800 font-semibold mt-3">
              Aasan answers the question CLOs have always wanted to answer: not "did they take the training?" but "are they ready?"
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function NavItem({ icon, label, badge, active }) {
  return (
    <button className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-left text-[12px] mb-0.5 ${
      active ? 'bg-navy text-white' : 'text-gray-600 hover:bg-gray-50'
    }`}>
      <span className="text-[14px]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
          {badge}
        </span>
      )}
    </button>
  )
}

function BizGoal({ label, date, readiness, active }) {
  return (
    <button className={`w-full text-left px-2.5 py-2 rounded-lg mb-1 ${active ? 'bg-gold/10 border border-gold/30' : 'hover:bg-gray-50'}`}>
      <p className="text-[11px] font-semibold text-text-primary truncate">{label}</p>
      <div className="flex items-center justify-between mt-0.5">
        <span className="text-[9px] text-gray-400">{date}</span>
        <span className={`text-[10px] font-mono ${readiness >= 60 ? 'text-green-600' : readiness >= 40 ? 'text-navy' : 'text-amber-600'}`}>
          {readiness}
        </span>
      </div>
      <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
        <div className={`h-full ${readiness >= 60 ? 'bg-green-400' : readiness >= 40 ? 'bg-navy' : 'bg-amber-400'}`} style={{ width: `${readiness}%` }} />
      </div>
    </button>
  )
}

function Intervention({ kind, color, title, detail, action }) {
  return (
    <div className="flex items-start gap-3 px-3 py-3 rounded-lg bg-gray-50">
      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wider shrink-0 ${color}`}>{kind}</span>
      <div className="flex-1 min-w-0">
        <h4 className="text-[13px] font-semibold text-text-primary leading-snug">{title}</h4>
        <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{detail}</p>
      </div>
      <button className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-[11px] text-navy font-medium hover:bg-navy hover:text-white shrink-0">
        {action}
      </button>
    </div>
  )
}
