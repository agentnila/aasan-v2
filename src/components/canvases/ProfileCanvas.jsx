import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import agent from "../../services/agentService";

/**
 * Profile canvas — the learner's personal "this is me at Aasan" page.
 *
 * Composes data already available from existing endpoints:
 *   /admin/me        → role, department, manager, email, modules, permissions
 *   /goal/list       → active goals with readiness + path summary
 *   /resume/journal  → service record / journal entries
 *
 * Sections:
 *   • Header — avatar, name, email, role, department, manager
 *   • Today's focus — current step on the primary goal
 *   • Goals at a glance — all active goals with readiness + progress
 *   • Service record snapshot — journal stats + 5 most recent entries
 *   • Quick links — Paths · Resume · Stay Ahead
 *
 * Skills (Neo4j concepts) and Endorsements gallery are deferred to a
 * follow-up — current sections cover the essentials a real employee
 * profile page needs.
 */

export default function ProfileCanvas() {
  const { user } = useUser();
  const userId = user?.id || "demo-user";

  const [me, setMe] = useState(null);
  const [goals, setGoals] = useState([]);
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      setLoading(true);
      const [meRes, goalsRes, journalRes] = await Promise.all([
        agent.getMe(userId).catch(() => null),
        agent.listGoals(userId).catch(() => null),
        agent.listJournal(userId, 50).catch(() => null),
      ]);
      if (cancelled) return;
      setMe(meRes || null);
      setGoals(goalsRes?.goals || []);
      setJournal(journalRes || null);
      setLoading(false);
    }
    loadAll();
    return () => { cancelled = true; };
  }, [userId]);

  // Find the primary active goal — its current step is "today's focus"
  const primaryGoal = useMemo(() => {
    return (
      goals.find((g) => g.priority === "primary" && g.status === "active") ||
      goals.find((g) => g.status === "active") ||
      null
    );
  }, [goals]);

  const journalEntries = journal?.entries || [];
  const journalByCategory = journal?.by_category || {};
  const totalSessions = journalEntries.length;

  // Aggregate skills from journal entries — distinct transferable_skills
  // ordered by frequency. Falls back gracefully when journal is empty.
  const topSkills = useMemo(() => {
    const counts = {};
    for (const e of journalEntries) {
      for (const s of e.transferable_skills || []) {
        const k = String(s).trim();
        if (!k) continue;
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12);
  }, [journalEntries]);

  const topTech = useMemo(() => {
    const counts = {};
    for (const e of journalEntries) {
      for (const t of e.technologies || []) {
        const k = String(t).trim();
        if (!k) continue;
        counts[k] = (counts[k] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 14);
  }, [journalEntries]);

  // Avatar fallback initials
  const initials = useMemo(() => {
    const name = me?.name || user?.fullName || "User";
    return name.split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "U";
  }, [me?.name, user?.fullName]);

  const displayName = me?.name || user?.fullName || user?.firstName || "Signed in";
  const displayEmail = me?.email || user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="space-y-5">
      {/* Header */}
      <header>
        <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1">YOUR PROFILE</p>
        <h1 className="text-[24px] font-bold text-text-primary tracking-tight">{displayName}</h1>
        <p className="text-[12px] text-gray-500 leading-relaxed max-w-2xl">
          Everything Aasan knows about you — what you're working toward, what you've shipped, who you work with.
        </p>
      </header>

      {/* Identity card */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-100 to-rose-200 text-rose-700 flex items-center justify-center text-[22px] font-bold shrink-0 overflow-hidden">
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[15px] font-bold text-text-primary">{displayName}</p>
            <p className="text-[12px] text-gray-600">{displayEmail}</p>
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {me?.role && (
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-navy/10 text-navy rounded-full px-2 py-0.5">
                  {me.role.replace(/_/g, " ")}
                </span>
              )}
              {me?.is_admin && (
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-100 text-amber-700 rounded-full px-2 py-0.5">
                  Admin
                </span>
              )}
            </div>
            {/* Detail rows */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mt-3 text-[12px]">
              {me?.department && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Department</p>
                  <p className="text-text-primary">{me.department}</p>
                </div>
              )}
              {me?.manager_user_id && (
                <div>
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Manager</p>
                  <p className="text-text-primary">{me.manager_user_id}</p>
                </div>
              )}
              {me?.modules && me.modules.length > 0 && (
                <div className="col-span-2">
                  <p className="text-[9px] text-gray-400 uppercase tracking-wider">Modules access</p>
                  <p className="text-gray-600">{me.modules.join(" · ")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Today's focus — primary goal current step */}
      {primaryGoal && (
        <section className="bg-gradient-to-br from-navy to-[#0f2a52] text-white rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-semibold tracking-wider text-gold mb-1">TODAY'S FOCUS</p>
          <p className="text-[18px] font-bold leading-tight mb-2">
            {primaryGoal.path_summary?.current_step_title || "Path is up to date"}
          </p>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[10px] uppercase tracking-wider text-gold/80">Goal</span>
            <span className="text-[12px] font-semibold">{primaryGoal.name}</span>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-white/15">
            <div>
              <p className="text-[20px] font-bold leading-none">{primaryGoal.readiness}</p>
              <p className="text-[9px] text-gold/70 uppercase tracking-wider mt-0.5">readiness</p>
            </div>
            <div>
              <p className="text-[20px] font-bold leading-none">{primaryGoal.path_summary?.progress_pct ?? 0}%</p>
              <p className="text-[9px] text-gold/70 uppercase tracking-wider mt-0.5">path progress</p>
            </div>
            <div>
              <p className="text-[20px] font-bold leading-none">{primaryGoal.days_left ?? "—"}</p>
              <p className="text-[9px] text-gold/70 uppercase tracking-wider mt-0.5">days left</p>
            </div>
          </div>
          <Link to="/paths" className="text-[11px] text-gold hover:underline mt-3 inline-block">
            Open path →
          </Link>
        </section>
      )}

      {/* Goals at a glance */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider">GOALS · {goals.length}</p>
          <Link to="/paths" className="text-[10px] text-green-700 hover:underline">View all →</Link>
        </div>
        {loading && <p className="text-[12px] text-gray-400">Loading…</p>}
        {!loading && goals.length === 0 && (
          <p className="text-[12px] text-gray-400 italic">
            No goals yet. <Link to="/paths?action=create-goal" className="text-green-700 hover:underline">Create your first goal →</Link>
          </p>
        )}
        {goals.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {goals.map((g) => {
              const priColor = g.priority === "primary" ? "bg-navy text-gold"
                : g.priority === "assigned" ? "bg-blue-600 text-white"
                : "bg-purple-100 text-purple-700";
              return (
                <Link
                  key={g.id}
                  to="/paths"
                  className="block px-3 py-2.5 rounded-lg border border-gray-100 hover:border-green-300 hover:bg-green-50/30 transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded ${priColor}`}>
                      {(g.priority || "").toUpperCase()}
                    </span>
                    <span className="text-[12px] font-semibold text-text-primary truncate flex-1">{g.name}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-green-500" style={{ width: `${g.path_summary?.progress_pct || 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1.5 text-[10px]">
                    <span className="text-gray-500">{g.path_summary?.completed_steps || 0}/{g.path_summary?.total_steps || 0} steps</span>
                    <span className="font-mono text-emerald-700">readiness {g.readiness}</span>
                  </div>
                  {g.context_url && (
                    <p className="text-[9px] text-blue-600 mt-1 truncate">📎 grounded in {(() => {
                      try { return new URL(g.context_url).hostname; } catch { return "linked context"; }
                    })()}</p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Service record snapshot */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider">SERVICE RECORD · {totalSessions} ENTRIES</p>
            <p className="text-[10px] text-gray-500 mt-0.5">Your living career journal — feeds the resume tailor.</p>
          </div>
          <Link to="/resume" className="text-[10px] text-emerald-700 hover:underline">View full record →</Link>
        </div>

        {/* Category strip */}
        {Object.keys(journalByCategory).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3 pb-3 border-b border-gray-100">
            {Object.entries(journalByCategory).map(([cat, n]) => (
              <span key={cat} className="text-[10px] bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
                <span className="text-gray-700">{cat.replace(/_/g, " ")}</span>
                <span className="text-gray-400 ml-1">{n}</span>
              </span>
            ))}
          </div>
        )}

        {/* Most recent 5 */}
        {journalEntries.length === 0 && !loading && (
          <p className="text-[12px] text-gray-400 italic">
            No entries yet. <Link to="/resume?action=add-entry" className="text-emerald-700 hover:underline">Log your first work entry →</Link>
          </p>
        )}
        {journalEntries.slice(0, 5).map((e, i) => (
          <div key={e.entry_id || i} className={`py-2 ${i > 0 ? "border-t border-gray-50" : ""}`}>
            <div className="flex items-baseline justify-between gap-2 mb-0.5">
              <p className="text-[12px] font-semibold text-text-primary truncate">{e.title}</p>
              <p className="text-[10px] font-mono text-gray-400 shrink-0">{e.date}</p>
            </div>
            {e.outcomes && e.outcomes.length > 0 && (
              <p className="text-[11px] text-gray-600 truncate">· {e.outcomes[0]}</p>
            )}
          </div>
        ))}
      </section>

      {/* Skills + Tech (derived from journal) */}
      {(topSkills.length > 0 || topTech.length > 0) && (
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {topSkills.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">TRANSFERABLE SKILLS · {topSkills.length}</p>
              <div className="flex flex-wrap gap-1.5">
                {topSkills.map(([skill, count]) => (
                  <span
                    key={skill}
                    className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5"
                  >
                    {skill}
                    {count > 1 && <span className="text-emerald-500 ml-1">×{count}</span>}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 italic mt-2">Pulled from your journal entries.</p>
            </div>
          )}

          {topTech.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">TECH STACK · {topTech.length}</p>
              <div className="flex flex-wrap gap-1.5">
                {topTech.map(([tech, count]) => (
                  <span
                    key={tech}
                    className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-2 py-0.5"
                  >
                    {tech}
                    {count > 1 && <span className="text-blue-500 ml-1">×{count}</span>}
                  </span>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 italic mt-2">Tools / languages you've cited in real work.</p>
            </div>
          )}
        </section>
      )}

      {/* Quick links */}
      <section>
        <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-2">SHORTCUTS</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Link to="/paths" className="px-3 py-2.5 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50/30 transition-colors text-[12px] font-semibold text-text-primary">
            🎯 My Paths
          </Link>
          <Link to="/resume" className="px-3 py-2.5 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors text-[12px] font-semibold text-text-primary">
            📋 Service Record
          </Link>
          <Link to="/stay-ahead" className="px-3 py-2.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-colors text-[12px] font-semibold text-text-primary">
            🛡 Stay Ahead
          </Link>
          <Link to="/marketplace" className="px-3 py-2.5 rounded-lg border border-gray-200 hover:border-rose-300 hover:bg-rose-50/30 transition-colors text-[12px] font-semibold text-text-primary">
            🤝 Marketplace
          </Link>
          <Link to="/team" className="px-3 py-2.5 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50/30 transition-colors text-[12px] font-semibold text-text-primary">
            👥 Team
          </Link>
          <Link to="/library" className="px-3 py-2.5 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors text-[12px] font-semibold text-text-primary">
            📚 Library
          </Link>
        </div>
      </section>
    </div>
  );
}
