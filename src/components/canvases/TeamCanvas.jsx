import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import agent from "../../services/agentService";

/**
 * Team canvas — Phase 1 manager view.
 *
 * Surface for a manager to see the learning progress of their direct reports
 * — readiness, recent activity, gaps, who needs attention. Plus inline
 * "Send kudos" + "Assign learning" CTAs.
 *
 * Data: /team/list (summary cards), /team/member (detail), /team/kudos
 * (manager → report). Phase 1 returns hardcoded demo team for `demo-user`;
 * empty for everyone else.
 *
 * Phase D wiring: real org structure via Workspace Directory or HRIS.
 */

const STATUS_STYLES = {
  on_track:   { dot: "bg-emerald-500", pill: "bg-emerald-50 text-emerald-700" },
  behind:     { dot: "bg-amber-500",   pill: "bg-amber-50 text-amber-700" },
  blocked:    { dot: "bg-red-500",     pill: "bg-red-50 text-red-700" },
  exploring:  { dot: "bg-blue-500",    pill: "bg-blue-50 text-blue-700" },
  mandatory:  { dot: "bg-violet-500",  pill: "bg-violet-50 text-violet-700" },
};

export default function TeamCanvas() {
  const { user } = useUser();
  const managerId = user?.id || "demo-user";

  const [tab, setTab] = useState("team"); // team | org_chart
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | on_track | behind | exploring | mandatory | needs_attention | skip
  const [expandedId, setExpandedId] = useState(null);
  const [includeSkip, setIncludeSkip] = useState(true);
  const [orgChart, setOrgChart] = useState(null);
  const [orgChartLoading, setOrgChartLoading] = useState(false);

  async function load() {
    setLoading(true);
    const result = await agent.listTeam(managerId, { includeSkip });
    setData(result);
    setLoading(false);
  }

  async function loadOrgChart() {
    setOrgChartLoading(true);
    const result = await agent.getOrgChart(managerId);
    setOrgChart(result);
    setOrgChartLoading(false);
  }

  useEffect(() => { load(); }, [includeSkip]);
  useEffect(() => { if (tab === "org_chart" && !orgChart) loadOrgChart(); }, [tab]);

  const team = data?.team || [];
  const summary = data?.summary || {};

  const filtered = useMemo(() => {
    if (filter === "all") return team;
    if (filter === "needs_attention") return team.filter((m) => m.manager_attention_flag);
    if (filter === "skip") return team.filter((m) => m.is_skip);
    if (filter === "direct") return team.filter((m) => !m.is_skip);
    return team.filter((m) => m.status === filter);
  }, [team, filter]);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">👥 Team</h1>
          <span className="text-[11px] text-gray-400">Your reports' learning + goal progress</span>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
          See who's on track, who's stuck, and where to focus your 1-on-1 time. Send kudos · assign learning · spot at-risk goals before review season. Org graph powered by the Department + Manager links from Admin Console.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <TabBtn active={tab === "team"}      onClick={() => setTab("team")}      label="👥 My team" />
        <TabBtn active={tab === "org_chart"} onClick={() => setTab("org_chart")} label="🌳 Org chart" />
        {tab === "team" && (
          <label className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-500">
            <input type="checkbox" checked={includeSkip} onChange={(e) => setIncludeSkip(e.target.checked)} />
            Include skip-level reports
          </label>
        )}
      </div>

      {tab === "org_chart" ? (
        <OrgChartView orgChart={orgChart} loading={orgChartLoading} />
      ) : (
      <>
      {/* Summary stats strip */}
      {!loading && team.length > 0 && (
        <section className="grid grid-cols-5 gap-3">
          <Stat label="Reports" value={data.count} />
          <Stat label="Avg readiness" value={summary.avg_readiness} suffix="/100" />
          <Stat label="Sessions / 30d" value={summary.total_sessions_30d} />
          <Stat label="Hours / 30d" value={Math.round((summary.total_minutes_30d || 0) / 60)} />
          <Stat label="Need attention" value={summary.needs_attention || 0} tone={summary.needs_attention ? "amber" : "neutral"} />
        </section>
      )}

      {!loading && team.length === 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="text-[40px] mb-2">👥</div>
          <h2 className="text-[16px] font-bold text-text-primary mb-1">No team members yet</h2>
          <p className="text-[12px] text-gray-500 leading-relaxed max-w-md mx-auto">
            We'll populate your team automatically when org structure is connected (Workspace Directory or HRIS — Phase D). Sign in as <span className="font-mono">demo-user</span> to see the demo team.
          </p>
        </section>
      )}

      {loading && <p className="text-[12px] text-gray-400">Loading your team…</p>}

      {!loading && team.length > 0 && (
        <>
          {/* Filter pills */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-2">FILTER</p>
            <div className="flex flex-wrap gap-1.5">
              <FilterPill active={filter === "all"}              count={team.length}              onClick={() => setFilter("all")}              label="All" />
              <FilterPill active={filter === "needs_attention"}  count={summary.needs_attention}   onClick={() => setFilter("needs_attention")}  label="⚠ Needs attention" tone="amber" />
              <FilterPill active={filter === "direct"}           count={summary.direct_count}      onClick={() => setFilter("direct")}           label="Direct" />
              {includeSkip && summary.skip_count > 0 && (
                <FilterPill active={filter === "skip"}           count={summary.skip_count}        onClick={() => setFilter("skip")}             label="Skip-level" />
              )}
              <FilterPill active={filter === "on_track"}         count={summary.on_track}          onClick={() => setFilter("on_track")}         label="On track" />
              <FilterPill active={filter === "behind"}           count={summary.behind}            onClick={() => setFilter("behind")}           label="Behind" />
              <FilterPill active={filter === "exploring"}        count={summary.exploring}         onClick={() => setFilter("exploring")}        label="Exploring" />
              <FilterPill active={filter === "mandatory"}        count={summary.mandatory}         onClick={() => setFilter("mandatory")}        label="Compliance" />
            </div>
          </section>

          {/* Team grid */}
          <section className="grid grid-cols-2 gap-3">
            {filtered.map((m) => (
              <MemberCard
                key={m.user_id}
                member={m}
                isOpen={expandedId === m.user_id}
                onToggle={() => setExpandedId(expandedId === m.user_id ? null : m.user_id)}
                managerId={managerId}
                onAfterAction={load}
              />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-2 text-[12px] text-gray-400 italic px-2 py-6 text-center">No team members match this filter.</p>
            )}
          </section>
        </>
      )}
      </>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`text-[12px] font-semibold px-4 py-2.5 transition-all border-b-2 ${
        active ? "border-amber-600 text-amber-700" : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

function OrgChartView({ orgChart, loading }) {
  if (loading) return <p className="text-[12px] text-gray-400">Loading org chart…</p>;
  const tree = orgChart?.tree || [];
  if (tree.length === 0) {
    return (
      <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="text-[28px] mb-2">🌳</div>
        <p className="text-[14px] font-bold text-text-primary mb-1">No org structure yet</p>
        <p className="text-[12px] text-gray-500 leading-relaxed max-w-md mx-auto">
          Import a CSV with <code className="text-[10px] bg-gray-100 px-1 rounded">manager_email</code> links from Admin Console → People → 📥 CSV import. Manager links resolve in a second pass, so an entire org imports in one shot.
        </p>
      </section>
    );
  }
  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">ORG TREE · {orgChart?.total_users} active users</p>
      <div className="space-y-1">
        {tree.map((root) => <TreeNode key={root.user_id} node={root} depth={0} />)}
      </div>
    </section>
  );
}

function TreeNode({ node, depth }) {
  const [open, setOpen] = useState(depth < 1);
  const reports = node.reports || [];
  const hasReports = reports.length > 0;
  return (
    <div>
      <button
        onClick={() => hasReports && setOpen(!open)}
        className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-md hover:bg-gray-50 transition-colors ${hasReports ? "" : "cursor-default"}`}
        style={{ paddingLeft: `${depth * 18 + 10}px` }}
      >
        {hasReports ? (
          <span className={`text-[9px] text-gray-400 transition-transform ${open ? "rotate-90" : ""} shrink-0 w-3`}>▶</span>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        <div className="w-7 h-7 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center text-[9px] font-bold shrink-0">
          {(node.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-text-primary truncate">{node.name}</p>
          <p className="text-[10px] text-gray-500 truncate">
            {node.role}
            {node.department && ` · ${node.department}`}
          </p>
        </div>
        {hasReports && <span className="text-[9px] text-gray-400 font-mono">{reports.length}</span>}
      </button>
      {open && hasReports && (
        <div className="border-l border-gray-100 ml-5">
          {reports.map((kid) => <TreeNode key={kid.user_id} node={kid} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, suffix, tone = "neutral" }) {
  const toneText = tone === "amber" ? "text-amber-700" : "text-text-primary";
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
      <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-0.5 uppercase">{label}</p>
      <p className={`text-[22px] font-bold ${toneText} leading-none`}>
        {value ?? "—"}{suffix && <span className="text-[12px] text-gray-400 ml-0.5">{suffix}</span>}
      </p>
    </div>
  );
}

function FilterPill({ active, onClick, label, count, tone }) {
  const colors = active
    ? "bg-amber-600 text-white"
    : tone === "amber"
      ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200";
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-medium rounded-full px-2.5 py-1 transition-colors ${colors}`}
    >
      {label}
      {count != null && <span className="opacity-70 ml-1">{count}</span>}
    </button>
  );
}

function MemberCard({ member, isOpen, onToggle, managerId, onAfterAction }) {
  const [busy, setBusy] = useState(false);
  const [kudosMsg, setKudosMsg] = useState("");
  const [showKudos, setShowKudos] = useState(false);
  const [kudosSent, setKudosSent] = useState(false);

  const m = member;
  const goal = m.primary_goal || {};
  const status = STATUS_STYLES[m.status] || STATUS_STYLES.exploring;
  const initials = (m.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  const flagged = !!m.manager_attention_flag;

  async function submitKudos() {
    setBusy(true);
    const result = await agent.sendTeamKudos({ managerId, reportId: m.user_id, message: kudosMsg });
    if (!result?.error) {
      setKudosSent(true);
      setShowKudos(false);
      onAfterAction?.();
    }
    setBusy(false);
  }

  function assignLearning() {
    // Hooks the existing /assignment/create flow via window event so chat
    // composes a goal-anchored assignment for this report.
    window.dispatchEvent(new CustomEvent("aasan:digest", {
      detail: {
        messageContent: `Assigning learning to ${m.name}. Open Peraasan chat (button below) to compose the assignment with content + due date.`,
        card: { type: "team_assign_prompt", report: { user_id: m.user_id, name: m.name, primary_goal: m.primary_goal } },
      },
    }));
  }

  return (
    <div className={`bg-white border rounded-2xl shadow-sm transition-colors ${isOpen ? "border-amber-300 col-span-2" : flagged ? "border-amber-300" : "border-gray-200"}`}>
      <button onClick={onToggle} className="w-full text-left p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[12px] font-bold shrink-0">{initials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-semibold text-text-primary truncate">{m.name}</span>
            <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium shrink-0 flex items-center gap-1 ${status.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {m.status_label}
            </span>
          </div>
          <p className="text-[10px] text-gray-500 truncate">{m.role}{m.team ? ` · ${m.team}` : ""}</p>
          <p className="text-[11px] text-text-primary font-medium mt-1.5 truncate">🎯 {goal.name}</p>
          <p className="text-[10px] text-gray-400">
            {goal.timeline}
            {goal.days_left != null && ` · ${goal.days_left} days left`}
            {goal.readiness_delta && ` · ${goal.readiness_delta}`}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[20px] font-bold text-amber-700 leading-none">{goal.readiness ?? "—"}</p>
          <p className="text-[8px] text-gray-400 uppercase tracking-wider">readiness</p>
        </div>
        <span className={`text-[9px] text-gray-400 shrink-0 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
      </button>

      {!isOpen && flagged && (
        <div className="mx-4 mb-3 px-2.5 py-1.5 bg-amber-50/80 border border-amber-200 rounded-md">
          <p className="text-[10px] text-amber-800 font-medium leading-snug">⚠ {m.manager_attention_flag}</p>
        </div>
      )}

      {isOpen && (
        <div className="px-4 pb-4 border-t border-amber-100 space-y-3">
          {flagged && (
            <div className="mt-3 px-3 py-2 bg-amber-50/80 border border-amber-200 rounded-md">
              <p className="text-[9px] font-semibold text-amber-700 tracking-wider mb-0.5">⚠ MANAGER ATTENTION</p>
              <p className="text-[11px] text-text-primary leading-snug">{m.manager_attention_flag}</p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2 mt-3">
            <Sub label="Sessions / 30d" value={m.sessions_30d} />
            <Sub label="Minutes / 30d" value={m.minutes_30d} />
            <Sub label="Steps done / 30d" value={m.completed_steps_30d} />
            <Sub label="Last active" value={fmtRelativeDate(m.last_active)} />
            <Sub label="Open gaps" value={m.gaps_count} tone={m.gaps_count > 3 ? "amber" : "neutral"} />
            <Sub label="Kudos received" value={m.kudos_count} />
          </div>

          {m.current_step && (
            <div>
              <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-0.5">CURRENT STEP</p>
              <p className="text-[12px] text-text-primary">→ {m.current_step}</p>
            </div>
          )}

          {(m.recent_sessions || []).length > 0 && (
            <div>
              <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-1">RECENT SESSIONS</p>
              <div className="space-y-1.5">
                {m.recent_sessions.map((s, i) => (
                  <div key={i} className="px-2.5 py-1.5 rounded-md border border-gray-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[10px] font-mono text-gray-400 shrink-0">{s.date}</span>
                      <span className="text-[11px] font-medium text-text-primary truncate">{s.title}</span>
                      {s.minutes && <span className="text-[9px] text-gray-400 shrink-0">{s.minutes}m</span>}
                      {s.mastery != null && <span className="text-[9px] text-emerald-700 shrink-0">⭐ {Math.round(s.mastery * 100)}%</span>}
                    </div>
                    {s.flagged && <p className="text-[10px] text-amber-700 italic mt-0.5">⚠ {s.flagged}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(m.gaps || []).length > 0 && (
            <div>
              <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-1">OPEN GAPS · {m.gaps.length}</p>
              <div className="flex flex-wrap gap-1">
                {m.gaps.map((g, i) => (
                  <span key={i} className="text-[10px] bg-amber-50 text-amber-700 rounded-full px-2 py-0.5">{g}</span>
                ))}
              </div>
            </div>
          )}

          {/* Manager actions */}
          <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center gap-1.5">
            {kudosSent ? (
              <span className="text-[11px] text-emerald-700 font-semibold">✓ Kudos sent</span>
            ) : showKudos ? (
              <div className="flex-1 flex items-center gap-1.5">
                <input
                  value={kudosMsg}
                  onChange={(e) => setKudosMsg(e.target.value)}
                  placeholder={`Quick note to ${m.name.split(" ")[0]}…`}
                  className="flex-1 px-2.5 py-1.5 rounded-md border border-amber-300 text-[11px] focus:outline-none focus:border-amber-500"
                  autoFocus
                />
                <button onClick={submitKudos} disabled={busy} className={`text-[11px] font-semibold rounded-md px-2.5 py-1.5 ${busy ? "bg-amber-100 text-amber-400" : "bg-amber-600 text-white hover:bg-amber-700"}`}>
                  {busy ? "Sending…" : "✓ Send"}
                </button>
                <button onClick={() => setShowKudos(false)} className="text-[11px] text-gray-500 hover:text-gray-700 px-2">Cancel</button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowKudos(true)}
                  className="text-[11px] font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-md px-2.5 py-1.5"
                >
                  👏 Send kudos
                </button>
                <button
                  onClick={assignLearning}
                  className="text-[11px] font-semibold border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-md px-2.5 py-1.5"
                >
                  📚 Assign learning
                </button>
                <span className="ml-auto text-[10px] text-gray-400 italic">Mode: {m.user_id}</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Sub({ label, value, tone = "neutral" }) {
  const toneText = tone === "amber" ? "text-amber-700" : "text-text-primary";
  return (
    <div>
      <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-0.5 uppercase">{label}</p>
      <p className={`text-[14px] font-semibold ${toneText} leading-none`}>{value ?? "—"}</p>
    </div>
  );
}

function fmtRelativeDate(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const today = new Date();
    const diffDays = Math.round((today - d) / 86400000);
    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.round(diffDays / 7)}w ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return iso; }
}
