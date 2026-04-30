import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import agent from "../../services/agentService";

/**
 * Stay Ahead canvas — Phase 3.
 *
 * The consumer wedge's primary surface. AI-resilience score full-bleed,
 * 5-component breakdown, trend chart from quarterly history, role mobility
 * (best-fit / stretch / pivot), up-the-stack moves, AI-replaced-today list.
 *
 * Data: /career/stay_ahead is the workhorse; Currency Watch (/freshness/scan)
 * and Career Compass (/career/scan) are surfaced as side actions that post
 * to the chat slide-over.
 */

const BAND_TONE = {
  green: { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-300" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-300" },
  red:   { bg: "bg-red-50",    text: "text-red-700",    ring: "ring-red-300" },
};

export default function StayAheadCanvas() {
  const { user } = useUser();
  const userId = user?.id || "demo-user";
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(null); // 'scan' | 'currency' | 'career' | 'scenario' | null

  async function loadStayAhead() {
    setLoading(true);
    const result = await agent.runStayAhead(userId);
    setData(result);
    setLoading(false);
  }

  useEffect(() => { loadStayAhead(); }, []);

  async function handleRescan() {
    setRunning("scan");
    await loadStayAhead();
    setRunning(null);
  }

  async function dispatchAction(kind) {
    setRunning(kind);
    try {
      if (kind === "currency") {
        const result = await agent.runCurrencyScan({ userId });
        const summary = `Currency scan — ${result.concepts_scanned || 0} concepts re-fetched · ${result.notifications_count || 0} need attention.`;
        window.dispatchEvent(new CustomEvent("aasan:digest", {
          detail: { messageContent: summary, card: { type: "currency_digest", ...result } },
        }));
      } else if (kind === "career") {
        const result = await agent.runCareerScan({ userId });
        const summary = `Career Compass — ${result.signals?.length || 0} market signals ranked by relevance.`;
        window.dispatchEvent(new CustomEvent("aasan:digest", {
          detail: { messageContent: summary, card: { type: "career_digest", ...result } },
        }));
      } else if (kind === "scenario") {
        const result = await agent.runScenarioSimulation(userId);
        const summary = `Career simulator — ${result.scenario_count || 0} paths projected with probability ranges.`;
        window.dispatchEvent(new CustomEvent("aasan:digest", {
          detail: { messageContent: summary, card: { type: "scenario_simulation", ...result } },
        }));
      }
    } catch (err) {
      console.log("[StayAhead]", kind, "failed:", err.message);
    }
    setRunning(null);
  }

  const r = data?.ai_resilience;
  const trend = r?.trend;
  const components = r?.components || [];
  const peer = r?.peer_benchmark;
  const tone = BAND_TONE[r?.band_tone] || BAND_TONE.green;
  const bestFit = data?.best_fit_roles || [];
  const stretch = data?.stretch_roles || [];
  const pivot = data?.pivot_options || [];

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">🛡 Stay Ahead</h1>
          <span className="text-[11px] text-gray-400">AI-resilience, per-individual — not aggregate</span>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
          McKinsey says 30% of jobs will be AI-augmented. We tell you yours. Plus: market watch, currency watch, scenario simulator — every signal that keeps you desired in a world reshaping work.
        </p>
      </header>

      {loading && !data && <p className="text-[12px] text-gray-400">Computing your AI-resilience score…</p>}

      {/* Score hero */}
      {r && (
        <section className={`bg-white border-2 ${tone.ring} ring-1 rounded-2xl p-6 shadow-sm`}>
          <div className="flex items-start gap-6">
            <div className="text-center shrink-0">
              <div className={`inline-flex flex-col items-center justify-center w-32 h-32 rounded-full ${tone.bg}`}>
                <p className="text-[48px] font-bold text-text-primary leading-none">{r.score}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">/ {r.score_max ?? 100}</p>
              </div>
              <p className={`mt-2 text-[12px] font-bold tracking-wider ${tone.text}`}>{(r.band || "").toUpperCase()}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1">AI-RESILIENCE SCORE</p>
              <p className="text-[14px] text-text-primary font-medium leading-snug">{r.band_verdict}</p>
              {r.headline && (
                <p className="text-[11px] text-gray-600 leading-relaxed mt-2">{r.headline}</p>
              )}
              {peer && (
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  <div>
                    <p className="text-[9px] text-gray-400 font-semibold tracking-wider">PEER AVG</p>
                    <p className="text-[14px] font-bold text-gray-700">{peer.peer_avg_score}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-semibold tracking-wider">YOU vs PEERS</p>
                    <p className={`text-[14px] font-bold ${peer.delta_vs_peers >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {peer.delta_vs_peers >= 0 ? "+" : ""}{peer.delta_vs_peers}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 font-semibold tracking-wider">PERCENTILE</p>
                    <p className="text-[14px] font-bold text-gray-700">p{peer.percentile}</p>
                  </div>
                  <p className="text-[10px] text-gray-400 ml-auto">{peer.role}</p>
                </div>
              )}
            </div>
            <button
              onClick={handleRescan}
              disabled={running === "scan"}
              className={`text-[11px] font-semibold rounded-md px-2.5 py-1 transition-colors ${
                running === "scan" ? "bg-gray-100 text-gray-400 cursor-wait"
                  : "bg-white border border-purple-300 text-purple-700 hover:bg-purple-50"
              }`}
            >
              {running === "scan" ? "Scanning…" : "↻ Re-run scan"}
            </button>
          </div>
        </section>
      )}

      {/* Trend mini-chart */}
      {trend?.history?.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider">TREND · {trend.history.length} QUARTERS</p>
            <span className={`text-[10px] font-mono ${trend.direction === "rising" ? "text-emerald-600" : trend.direction === "falling" ? "text-red-600" : "text-gray-500"}`}>
              {trend.direction} · {trend.change_last_quarter >= 0 ? "+" : ""}{trend.change_last_quarter} last qtr
            </span>
          </div>
          <TrendBars history={trend.history} />
          {trend.narrative && (
            <p className="text-[11px] text-gray-700 leading-relaxed mt-3">{trend.narrative}</p>
          )}
        </section>
      )}

      {/* Components */}
      {components.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">5 COMPONENTS · WHAT DRIVES THE SCORE</p>
          <div className="space-y-2.5">
            {components.map((c, i) => (
              <div key={i}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[12px] font-semibold text-text-primary">{c.label}</span>
                  <span className="text-[12px] font-mono text-purple-700">{c.score}</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500" style={{ width: `${c.score}%` }} />
                </div>
                {c.note && <p className="text-[10px] text-gray-500 mt-0.5 italic">{c.note}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Mobility cluster — best-fit / stretch / pivot */}
      {(bestFit.length > 0 || stretch.length > 0 || pivot.length > 0) && (
        <section className="grid grid-cols-3 gap-3">
          <RoleColumn title="🎯 BEST FIT" tone="emerald" roles={bestFit} />
          <RoleColumn title="↗ STRETCH" tone="amber" roles={stretch} />
          <RoleColumn title="⤿ PIVOT" tone="blue" roles={pivot} />
        </section>
      )}

      {/* Up-the-stack moves */}
      {(r?.up_the_stack_moves || []).length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">↑ UP-THE-STACK MOVES · {r.up_the_stack_moves.length}</p>
          <div className="space-y-2">
            {r.up_the_stack_moves.map((m, i) => (
              <div key={i} className="px-3 py-2 rounded-lg border border-gray-100">
                <p className="text-[12px] font-semibold text-text-primary">{m.title}</p>
                {m.what && <p className="text-[11px] text-gray-600 mt-0.5 leading-relaxed">{m.what}</p>}
                {m.concrete_step && <p className="text-[10px] text-purple-700 mt-1 italic">→ {m.concrete_step}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* What AI is taking + amplifying */}
      {(r?.ai_replaced_today?.length || r?.ai_amplified_skills?.length) > 0 && (
        <section className="grid grid-cols-2 gap-3">
          <ListBlock
            title="🤖 AI IS TAKING"
            tone="red"
            items={r.ai_replaced_today || []}
            note="Don't define your career around these."
          />
          <ListBlock
            title="⚡ AI AMPLIFIES YOU"
            tone="emerald"
            items={r.ai_amplified_skills || []}
            note="Lean into these. AI makes you 10×."
          />
        </section>
      )}

      {/* Tools strip */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">RUN A FRESH SCAN</p>
        <div className="grid grid-cols-3 gap-2">
          <ToolButton label="⚙ Career Compass" hint="Market + courses + cert announcements" busy={running === "career"} onClick={() => dispatchAction("career")} />
          <ToolButton label="⚙ Currency Watch" hint="What's gone stale in your skills" busy={running === "currency"} onClick={() => dispatchAction("currency")} />
          <ToolButton label="🔮 Scenario Simulator" hint="Stay vs pivot vs stretch — projected" busy={running === "scenario"} onClick={() => dispatchAction("scenario")} />
        </div>
        <p className="text-[10px] text-gray-400 italic mt-2">Results post into Peraasan chat (open via the button at the bottom right).</p>
      </section>
    </div>
  );
}

function TrendBars({ history }) {
  const max = Math.max(...history.map((h) => h.score));
  return (
    <div className="flex items-end gap-2 h-20">
      {history.map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <p className="text-[9px] font-mono text-purple-700">{h.score}</p>
          <div className="w-full bg-purple-500 rounded-t" style={{ height: `${(h.score / max) * 60}px` }} />
          <p className="text-[8px] text-gray-400 mt-0.5">{h.quarter}</p>
        </div>
      ))}
    </div>
  );
}

function RoleColumn({ title, tone, roles }) {
  const colors = {
    emerald: "border-emerald-200 bg-emerald-50/40",
    amber: "border-amber-200 bg-amber-50/40",
    blue: "border-blue-200 bg-blue-50/40",
  }[tone];
  return (
    <div className={`bg-white border-2 ${colors} rounded-2xl p-4 shadow-sm`}>
      <p className="text-[10px] text-gray-500 font-semibold tracking-wider mb-2">{title} · {roles.length}</p>
      <div className="space-y-2">
        {roles.length === 0 && <p className="text-[10px] text-gray-400 italic">None right now.</p>}
        {roles.slice(0, 3).map((role, i) => (
          <div key={i} className="px-2.5 py-2 rounded-lg bg-white border border-gray-100">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[11px] font-semibold text-text-primary truncate">{role.title}</span>
              {role.match_score != null && (
                <span className="text-[9px] font-mono text-emerald-700 shrink-0">{Math.round(role.match_score * 100)}%</span>
              )}
            </div>
            <p className="text-[9px] text-gray-500 truncate">{role.company}</p>
            {role.salary_range && <p className="text-[9px] text-gray-400 mt-0.5">{role.salary_range}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function ListBlock({ title, tone, items, note }) {
  const colors = {
    red:     { border: "border-red-200",     bg: "bg-red-50/30",     dot: "bg-red-500",     text: "text-red-700" },
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50/30", dot: "bg-emerald-500", text: "text-emerald-700" },
  }[tone];
  return (
    <div className={`bg-white border ${colors.border} ${colors.bg} rounded-2xl p-5 shadow-sm`}>
      <p className={`text-[10px] font-semibold tracking-wider mb-2 ${colors.text}`}>{title}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} mt-1.5 shrink-0`} />
            <span className="text-[11px] text-text-primary leading-relaxed">{it}</span>
          </li>
        ))}
      </ul>
      {note && <p className="text-[10px] text-gray-500 italic mt-2">{note}</p>}
    </div>
  );
}

function ToolButton({ label, hint, busy, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`text-left px-3 py-2.5 rounded-lg border transition-all ${
        busy ? "bg-purple-50 border-purple-200 cursor-wait"
          : "bg-white border-gray-200 hover:border-purple-300 hover:bg-purple-50/40"
      }`}
    >
      <p className="text-[12px] font-semibold text-text-primary">{busy ? "Running…" : label}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{hint}</p>
    </button>
  );
}
