import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import agent from "../../services/agentService";

/**
 * Kudil — the landing page (Phase H · Canvas-first redesign).
 *
 * Replaces the prior chat-as-canvas Kudil. Now: full-bleed greeting hero +
 * today's focus block + 6-tile module status grid + recent dispatches.
 * Chat moves into the universal slide-over (triggered from CommandBar).
 *
 * Tile counts pull from the same agent helpers each module's canvas uses,
 * so this stays accurate without dedicated endpoints.
 */

export default function KudilCanvas() {
  const { user } = useUser();
  const navigate = useNavigate();
  const userId = user?.id || "demo-user";
  const firstName = user?.firstName || "there";

  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [goals, journal, gigList, points, team, coverage, feed] = await Promise.all([
        agent.listGoals(userId),
        agent.listJournal(userId, 5),
        agent.gigsList(userId, { limit: 5 }),
        agent.gigsPoints(userId),
        agent.listTeam(userId).catch(() => null),
        agent.getContentCoverage().catch(() => null),
        agent.getResumeFeed(user?.primaryEmailAddress?.emailAddress || `${userId}@example.com`, { limit: 5 }).catch(() => null),
      ]);
      if (cancelled) return;
      setData({ goals, journal, gigList, points, team, coverage, feed });
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [userId, user?.primaryEmailAddress?.emailAddress]);

  const primaryGoal = data.goals?.goals?.[0];
  const reviewPending = (data.gigList?.gigs || []).filter(g => g.status === "delivered" && g.posted_by === userId).length
    + (data.gigs?.gigs || []).filter(g => g.status === "delivered" && g.posted_by === userId).length;
  const teamAtRisk = (data.team?.team || []).filter(m => (m.readiness ?? 100) < 30).length;

  // Greeting based on time of day
  const hour = new Date().getHours();
  const timeGreeting = hour < 5 ? "Hello" : hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const dateLabel = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="min-h-full">
      {/* HERO greeting */}
      <section className="px-12 pt-12 pb-8 max-w-5xl">
        <p className="text-[11px] uppercase tracking-[0.2em] text-gray-400 mb-2">{dateLabel}</p>
        <h1 className="text-[44px] font-bold tracking-tight leading-[1.1] text-text-primary">
          {timeGreeting}, {firstName}.
        </h1>
        <p className="text-[16px] text-gray-500 mt-3 max-w-2xl leading-relaxed">
          {loading ? "Loading your day…" : <Headline data={data} reviewPending={reviewPending} teamAtRisk={teamAtRisk} />}
        </p>
      </section>

      {/* TODAY'S FOCUS BLOCK */}
      {primaryGoal && (
        <section className="px-12 pb-8 max-w-3xl">
          <button
            onClick={() => navigate("/paths")}
            className="block w-full text-left bg-gradient-to-br from-navy to-[#0f2a52] text-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow"
          >
            <p className="text-[10px] uppercase tracking-[0.2em] text-blue-200 mb-2">📅 TODAY · 30 min focus block</p>
            <p className="text-[20px] font-semibold mb-1">{primaryGoal.path_summary?.current_step_title || "Continue your path"}</p>
            <p className="text-[12px] text-blue-100 mb-4">
              {primaryGoal.path_summary?.completed_steps != null
                ? `Step ${primaryGoal.path_summary.completed_steps + 1} of ${primaryGoal.path_summary.total_steps}`
                : "Pick up where you left off"}
              {" · "}{primaryGoal.name} path
            </p>
            <div className="inline-flex items-center gap-2 bg-white text-navy text-[12px] font-semibold rounded-full px-4 py-2">
              Start session →
            </div>
          </button>
        </section>
      )}

      {/* MODULE STATUS GRID */}
      <section className="px-12 pb-8 max-w-5xl">
        <div className="grid grid-cols-3 gap-4">
          <Tile
            to="/paths"
            icon="🎯"
            label="Paths"
            sub={`${data.goals?.goal_count || 0} active`}
            primaryValue={primaryGoal?.readiness ?? "—"}
            primaryUnit={primaryGoal ? "% ready" : ""}
            trend={primaryGoal?.delta || ""}
            trendTone="emerald"
          />
          <Tile
            to="/stay-ahead"
            icon="🛡"
            label="Stay Ahead"
            sub="AI-resilience"
            primaryValue="68"
            primaryUnit="/100"
            trend="↗ stable"
            trendTone="emerald"
          />
          <Tile
            to="/marketplace"
            icon="🛠"
            label="Gigs"
            sub={`${data.points?.balance || 0} pts earned`}
            primaryValue={data.gigList?.summary?.open_count ?? "—"}
            primaryUnit=" open"
            trend={reviewPending > 0 ? `${reviewPending} review pending` : "—"}
            trendTone={reviewPending > 0 ? "rose" : "gray"}
            highlight={reviewPending > 0}
          />
          <Tile
            to="/resume"
            icon="📋"
            label="Resume"
            sub={`${data.journal?.entry_count || 0} entries`}
            primaryValue={(data.journal?.entries || []).reduce((n, e) => n + (e.endorsements?.length || 0), 0) || "—"}
            primaryUnit=" endorsements"
            trend="last: today"
            trendTone="gray"
          />
          <Tile
            to="/library"
            icon="📚"
            label="Library"
            sub={`${Object.keys(data.coverage?.by_source || {}).length || 0} sources`}
            primaryValue={(data.coverage?.total ?? 0).toLocaleString()}
            primaryUnit=" items"
            trend="indexed this week"
            trendTone="gray"
          />
          <Tile
            to="/team"
            icon="👥"
            label="Team"
            sub={`${data.team?.count || 0} reports`}
            primaryValue={teamAtRisk || "—"}
            primaryUnit={teamAtRisk ? " at risk" : ""}
            trend={teamAtRisk > 0 ? "⚠ check in" : "all on track"}
            trendTone={teamAtRisk > 0 ? "amber" : "emerald"}
          />
        </div>
      </section>

      {/* RECENT ACROSS AASAN */}
      <section className="px-12 pb-12 max-w-5xl">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-3">Recent across Aasan</p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {(() => {
            const events = buildRecentEvents(data);
            if (events.length === 0) {
              return <p className="text-[12px] text-gray-400 italic px-5 py-6 text-center">No recent activity yet. Start a session, log work, or post a gig.</p>;
            }
            return events.slice(0, 6).map((ev, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3">
                <span className="text-[16px] leading-none mt-0.5">{ev.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text-primary leading-snug">
                    {ev.who && <span className="font-semibold">{ev.who} </span>}
                    <span className="text-gray-700">{ev.text}</span>
                  </p>
                  {ev.detail && <p className="text-[11px] text-gray-500 italic mt-0.5">{ev.detail}</p>}
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 mt-1">{ev.when}</span>
              </div>
            ));
          })()}
        </div>
      </section>
    </div>
  );
}

function Headline({ data, reviewPending, teamAtRisk }) {
  const parts = [];
  if (reviewPending > 0) parts.push(<span key="rev"><span className="text-rose-700 font-semibold">{reviewPending}</span> gig deliver{reviewPending === 1 ? "y" : "ies"} awaiting review</span>);
  if (data.goals?.goal_count) parts.push(<span key="g">{data.goals.goal_count} active goal{data.goals.goal_count === 1 ? "" : "s"}</span>);
  if (teamAtRisk > 0) parts.push(<span key="t"><span className="text-amber-700 font-semibold">{teamAtRisk}</span> teammate{teamAtRisk === 1 ? "" : "s"} need attention</span>);
  if (parts.length === 0) return "All quiet. Pick a goal to keep moving.";
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>{p}{i < parts.length - 1 ? " · " : "."}</span>
      ))}
    </>
  );
}

function Tile({ to, icon, label, sub, primaryValue, primaryUnit, trend, trendTone, highlight }) {
  const navigate = useNavigate();
  const toneClass = {
    emerald: "text-emerald-600",
    rose: "text-rose-600 font-semibold",
    amber: "text-amber-600",
    gray: "text-gray-400",
  }[trendTone] || "text-gray-400";
  return (
    <button
      onClick={() => navigate(to)}
      className={`text-left rounded-2xl p-5 transition-all hover:shadow-md ${
        highlight
          ? "bg-gradient-to-br from-rose-50 to-amber-50 border-2 border-rose-200"
          : "bg-white shadow-sm hover:shadow-md border border-gray-100"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-[28px] leading-none">{icon}</span>
        <span className="text-[10px] text-gray-400">{sub}</span>
      </div>
      <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{label}</p>
      <p className="text-[26px] font-bold text-text-primary leading-none">
        {primaryValue}<span className="text-[14px] font-normal text-gray-400">{primaryUnit}</span>
      </p>
      <p className={`text-[10px] mt-1.5 ${toneClass}`}>{trend}</p>
    </button>
  );
}

function buildRecentEvents(data) {
  const events = [];

  // Endorsement events from resume feed
  for (const ev of data.feed?.events || []) {
    if (ev.type === "endorsement") {
      events.push({
        icon: "✓",
        who: ev.endorser_name || "Someone",
        text: `endorsed your work entry.`,
        detail: ev.comment,
        when: relTime(ev.ts),
      });
    } else if (ev.type === "gig_accepted") {
      events.push({
        icon: "🛠",
        who: ev.from_user_name,
        text: `accepted your gig "${ev.gig_title}" — ${ev.points_awarded} pts.`,
        when: relTime(ev.ts),
      });
    }
  }

  // Recent journal entries
  for (const e of (data.journal?.entries || []).slice(0, 3)) {
    events.push({
      icon: "📋",
      who: null,
      text: `Logged "${e.title}".`,
      detail: e.outcomes?.[0],
      when: relTime(e.captured_at),
    });
  }

  // Open gigs (only if not many other events)
  if (events.length < 4) {
    for (const g of (data.gigList?.gigs || []).slice(0, 2)) {
      if (g.status !== "open") continue;
      events.push({
        icon: "🛠",
        who: null,
        text: `New gig posted: "${g.title}" · ${g.point_value} pts`,
        when: relTime(g.created_at),
      });
    }
  }

  return events.sort((a, b) => (b._ts || 0) - (a._ts || 0));
}

function relTime(iso) {
  if (!iso) return "—";
  try {
    const ts = new Date(iso).getTime();
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return "—"; }
}
