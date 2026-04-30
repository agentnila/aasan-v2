import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import agent from "../../services/agentService";

/**
 * Marketplace canvas — Phase 3.
 *
 * Two tabs surfaced as canvas dashboards (no chat round-trip needed):
 *   1. Browse — SME list with search + filter pills + click-to-expand,
 *      inline Book flow (find slots → pick → confirm) without leaving
 *      the canvas.
 *   2. My Bookings — both-sides inbox (📖 I booked / 🤝 I'm the SME).
 *
 * "Become an SME" lives in the left module pane (Marketplace section of the
 * filtered SourcesNav) — same form as before; not duplicated here.
 */

export default function MarketplaceCanvas() {
  const { user } = useUser();
  const userId = user?.id || "demo-user";
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = ["browse", "bookings", "gigs"].includes(searchParams.get("tab"))
    ? searchParams.get("tab") : "browse";
  const [tab, setTab] = useState(initialTab);

  // Strip the URL params after first read so back-nav doesn't re-trigger
  useEffect(() => {
    if (searchParams.get("tab") || searchParams.get("view")) {
      const next = new URLSearchParams(searchParams);
      next.delete("tab");
      // keep `view` for the GigsTab to read on its first mount
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">🤝 Marketplace</h1>
          <span className="text-[11px] text-gray-400">The SME directory your company wishes it had</span>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
          Find an internal expert in 5 minutes, an external one in an hour. Or share what you know — register as an SME (left pane) and earn kudos / get booked.
        </p>
      </header>

      <div className="flex items-center gap-1 border-b border-gray-200">
        <Tab id="browse"   active={tab === "browse"}   onClick={() => setTab("browse")} label="👥 Browse SMEs" />
        <Tab id="bookings" active={tab === "bookings"} onClick={() => setTab("bookings")} label="📅 My Bookings" />
        <Tab id="gigs"     active={tab === "gigs"}     onClick={() => setTab("gigs")}     label="🛠 Gigs" />
      </div>

      {tab === "browse" && <BrowseTab userId={userId} />}
      {tab === "bookings" && <BookingsTab userId={userId} />}
      {tab === "gigs" && <GigsTab userId={userId} />}
    </div>
  );
}

function Tab({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`text-[12px] font-semibold px-4 py-2.5 transition-all border-b-2 ${
        active ? "border-rose-600 text-rose-700" : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// BROWSE TAB
// ──────────────────────────────────────────────────────────────

function BrowseTab({ userId }) {
  const [smes, setSmes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeSubject, setActiveSubject] = useState(null);
  const [activeType, setActiveType] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [bookingFor, setBookingFor] = useState(null); // sme_id currently booking

  async function loadSMEs() {
    setLoading(true);
    const result = await agent.listSMEs({ activeOnly: true, limit: 100 });
    setSmes(result?.smes || []);
    setLoading(false);
  }

  useEffect(() => { loadSMEs(); }, []);

  const subjectsTop = useMemo(() => {
    const counts = new Map();
    smes.forEach(s => (s.topics || []).forEach(t => counts.set(t, (counts.get(t) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 12);
  }, [smes]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return smes.filter(s => {
      if (activeType && s.sme_type !== activeType) return false;
      if (activeSubject && !(s.topics || []).includes(activeSubject)) return false;
      if (!q) return true;
      const blob = [s.name, s.role, s.team, s.bio, s.expectations_from_students,
        ...(s.topics || []), ...(s.languages || [])].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [smes, query, activeSubject, activeType]);

  function rateLabel(s) {
    if (s.rate_model === "free") return "Free";
    if (s.rate_model === "paid" || (s.rate_per_30min || 0) > 0) {
      return `${(s.rate_currency || "usd").toUpperCase()} ${s.rate_per_30min}/30 min`;
    }
    return s.sme_type === "external" ? "Curated · contact" : "Kudos only";
  }

  return (
    <div className="space-y-3">
      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, subject, role, bio…"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-rose-400 mb-2"
        />
        <div className="flex flex-wrap gap-1">
          <FilterPill active={!activeType && !activeSubject} onClick={() => { setActiveType(null); setActiveSubject(null); }} label={`All ${smes.length}`} />
          {["internal", "external"].map((t) => (
            <FilterPill key={t} active={activeType === t} onClick={() => setActiveType(activeType === t ? null : t)} label={t === "internal" ? "🏢 Internal" : "🌐 External"} />
          ))}
          {subjectsTop.map(([sub, n]) => (
            <FilterPill key={sub} active={activeSubject === sub} onClick={() => setActiveSubject(activeSubject === sub ? null : sub)} label={`${sub} ${n}`} />
          ))}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">
          {filtered.length} of {smes.length} SMEs{(query || activeSubject || activeType) ? " (filtered)" : ""}
        </p>
        {loading && <p className="text-[12px] text-gray-400">Loading marketplace…</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-[12px] text-gray-400 italic px-2 py-4 text-center">No SMEs match. Try adjusting your filters.</p>
        )}
        <div className="space-y-1.5">
          {filtered.map((s, i) => {
            const isOpen = expandedId === s.sme_id;
            const isInternal = s.sme_type === "internal";
            const initials = (s.name || "?").split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
            return (
              <div key={s.sme_id || i} className={`rounded-lg border transition-colors ${isOpen ? "border-rose-300 bg-rose-50/30" : "border-gray-100"}`}>
                <button onClick={() => setExpandedId(isOpen ? null : s.sme_id)} className="w-full text-left px-3 py-2.5 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isInternal ? "bg-rose-100 text-rose-700" : "bg-violet-100 text-violet-700"}`}>{initials}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] font-semibold text-text-primary truncate">{s.name}</span>
                      <span className="text-[9px] text-gray-400">{isInternal ? "internal" : "external"}</span>
                    </div>
                    {(s.role || s.team) && <p className="text-[10px] text-gray-500 truncate">{s.role}{s.team ? ` · ${s.team}` : ""}</p>}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(s.topics || []).slice(0, 4).map((t, j) => (
                        <span key={j} className="text-[9px] bg-rose-50 text-rose-700 rounded-full px-1.5 py-0.5">{t}</span>
                      ))}
                      {(s.topics || []).length > 4 && <span className="text-[9px] text-gray-400">+{(s.topics || []).length - 4}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[10px] font-medium text-gray-700">{rateLabel(s)}</p>
                    <p className="text-[9px] text-gray-400">⭐ {(s.kudos_score ?? 5).toFixed(1)}</p>
                  </div>
                  <span className={`text-[9px] text-gray-400 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
                </button>

                {isOpen && (
                  <div className="ml-9 pl-2 mr-3 mb-3 border-l-2 border-rose-100 space-y-2.5">
                    {s.bio && <p className="text-[11px] text-gray-700 leading-relaxed">{s.bio}</p>}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-0.5">SCHEDULE</p>
                        <p className="text-gray-700">{s.schedule_window || s.availability_window || s.next_available || "—"}</p>
                        {s.timezone && <p className="text-[9px] text-gray-400 mt-0.5">{s.timezone}</p>}
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-0.5">SESSION</p>
                        <p className="text-gray-700">{s.preferred_session_length || 30} min · {rateLabel(s)}</p>
                        {(s.languages || []).length > 0 && <p className="text-[9px] text-gray-400 mt-0.5">{s.languages.join(", ").toUpperCase()}</p>}
                      </div>
                    </div>
                    {s.expectations_from_students && (
                      <div className="bg-rose-50/60 border border-rose-100 rounded-md px-2.5 py-2">
                        <p className="text-[9px] font-semibold text-rose-700 tracking-wider mb-0.5">⚡ READ THIS BEFORE BOOKING</p>
                        <p className="text-[11px] text-gray-700 leading-relaxed">{s.expectations_from_students}</p>
                      </div>
                    )}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => setBookingFor(s.sme_id)}
                        className="text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-md px-3 py-1.5 transition-colors"
                      >
                        Book {s.name.split(" ")[0]} →
                      </button>
                      <span className="text-[9px] text-gray-400">{s.sessions_completed > 0 ? `${s.sessions_completed} sessions completed` : "New SME"}</span>
                    </div>
                    {bookingFor === s.sme_id && (
                      <InlineBookingFlow
                        userId={userId}
                        sme={s}
                        onClose={() => setBookingFor(null)}
                        onBooked={() => { setBookingFor(null); setExpandedId(null); }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function FilterPill({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`text-[10px] font-medium rounded-full px-2 py-0.5 transition-colors ${
        active ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

// ──────────────────────────────────────────────────────────────
// INLINE BOOKING FLOW — find slots → pick → confirm
// (no chat round-trip needed)
// ──────────────────────────────────────────────────────────────

function InlineBookingFlow({ userId, sme, onClose, onBooked }) {
  const [phase, setPhase] = useState("loading"); // loading | slots | booking | done | error
  const [slots, setSlots] = useState([]);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const result = await agent.findSMESlots(sme.sme_id, userId, { durationMin: 30, count: 3 });
      if (cancelled) return;
      if (result?.error) {
        setError(result.error);
        setPhase("error");
      } else {
        setSlots(result.slots || []);
        setMeta(result);
        setPhase("slots");
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sme.sme_id]);

  async function pickSlot(slot) {
    setPhase("booking");
    const result = await agent.bookSMESlot({
      smeId: sme.sme_id,
      learnerId: userId,
      topic: (sme.topics || ["session"])[0],
      startAt: slot.start,
      endAt: slot.end,
    });
    if (result?.booking_id) {
      setPhase("done");
      setTimeout(() => onBooked?.(), 1500);
    } else {
      setError(result?.error || "Booking failed");
      setPhase("error");
    }
  }

  return (
    <div className="bg-white border border-rose-300 rounded-lg p-3 mt-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-rose-700 tracking-wider">📅 PICK A SLOT — {sme.name}</p>
        <button onClick={onClose} className="text-[10px] text-gray-400 hover:text-gray-700">✕ Cancel</button>
      </div>
      {phase === "loading" && <p className="text-[11px] text-gray-500">Finding times that work for both of you…</p>}
      {phase === "error" && <p className="text-[11px] text-red-600">{error}</p>}
      {phase === "booking" && <p className="text-[11px] text-gray-500">Booking…</p>}
      {phase === "done" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          <p className="text-[11px] text-emerald-700 font-semibold">✓ Booked. Calendar invites sent to both of you.</p>
        </div>
      )}
      {phase === "slots" && (
        <>
          {meta?.schedule_window_text && (
            <p className="text-[10px] text-gray-500 mb-2">Their window: <span className="text-gray-700">{meta.schedule_window_text}</span></p>
          )}
          {slots.length === 0 ? (
            <p className="text-[11px] text-gray-500 italic">No slots fit both your calendar and theirs in the next 14 days.</p>
          ) : (
            <div className="space-y-1.5">
              {slots.map((s, i) => (
                <button key={i} onClick={() => pickSlot(s)} className="w-full text-left flex items-center gap-3 p-2 rounded-md border border-gray-100 hover:border-rose-300 hover:bg-rose-50/30 transition-all">
                  <div className="w-12 text-center shrink-0">
                    <p className="text-[9px] text-gray-400">{s.day}</p>
                    <p className="text-[11px] font-bold text-text-primary">{s.time.split(" – ")[0]}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-text-primary">{s.time}</p>
                    <p className="text-[9px] text-gray-400">{s.fit}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// BOOKINGS TAB
// ──────────────────────────────────────────────────────────────

function BookingsTab({ userId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState("all");
  const [expandedId, setExpandedId] = useState(null);

  async function load() {
    setLoading(true);
    const result = await agent.listMyBookings(userId);
    setData(result);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const asLearner = data?.as_learner || [];
  const asSme = data?.as_sme || [];
  const all = useMemo(
    () => [...asLearner, ...asSme].sort((a, b) => (a.scheduled_at || "").localeCompare(b.scheduled_at || "")),
    [asLearner, asSme],
  );
  const visible = side === "as_learner" ? asLearner : side === "as_sme" ? asSme : all;

  function fmtRange(startIso, endIso) {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso || startIso);
      const today = new Date();
      const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
      const dayLabel = s.toDateString() === today.toDateString() ? "Today"
        : s.toDateString() === tomorrow.toDateString() ? "Tomorrow"
        : s.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
      const fmt = (d) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
      return `${dayLabel} · ${fmt(s)}–${fmt(e)}`;
    } catch { return startIso; }
  }
  function statusPill(s) {
    return ({
      confirmed:   "bg-emerald-50 text-emerald-700",
      requested:   "bg-amber-50 text-amber-700",
      completed:   "bg-gray-100 text-gray-600",
      cancelled:   "bg-red-50 text-red-700",
      no_show:     "bg-red-50 text-red-700",
      rescheduled: "bg-blue-50 text-blue-700",
    })[s] || "bg-gray-100 text-gray-600";
  }

  return (
    <div className="space-y-3">
      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider">UPCOMING · {data?.total ?? 0}</p>
          <p className="text-[10px] text-gray-400">{asLearner.length} you booked · {asSme.length} where you're the SME</p>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          <FilterPill active={side === "all"}        onClick={() => setSide("all")}        label={`All ${all.length}`} />
          <FilterPill active={side === "as_learner"} onClick={() => setSide("as_learner")} label={`📖 I booked ${asLearner.length}`} />
          <FilterPill active={side === "as_sme"}     onClick={() => setSide("as_sme")}     label={`🤝 I'm the SME ${asSme.length}`} />
        </div>
        {loading && <p className="text-[12px] text-gray-400">Loading bookings…</p>}
        {!loading && visible.length === 0 && (
          <p className="text-[12px] text-gray-400 italic px-2 py-6 text-center">
            {side === "as_sme" ? "No one's booked you yet. Make sure your SME profile is complete (left pane → 📚 Become an SME)."
              : side === "as_learner" ? "Nothing booked. Switch to Browse to find an SME."
              : "Nothing scheduled."}
          </p>
        )}
        <div className="space-y-1.5">
          {visible.map((b, i) => {
            const isOpen = expandedId === b.booking_id;
            const isLearner = b.side === "learner";
            return (
              <div key={`${b.side}-${b.booking_id}-${i}`} className={`rounded-lg border ${isOpen ? "border-rose-300 bg-rose-50/30" : "border-gray-100"}`}>
                <button onClick={() => setExpandedId(isOpen ? null : b.booking_id)} className="w-full text-left px-3 py-2.5 flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[14px] shrink-0 ${isLearner ? "bg-rose-100" : "bg-violet-100"}`}>{isLearner ? "📖" : "🤝"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[12px] font-semibold text-text-primary truncate">{b.topic || "Session"}</span>
                      <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium shrink-0 ${statusPill(b.status)}`}>{b.status}</span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate">{isLearner ? `with ${b.sme_name}` : `Booked by ${b.learner_id}`}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{fmtRange(b.scheduled_at, b.end_at)} · {b.duration_minutes || 30} min</p>
                  </div>
                  <span className={`text-[9px] text-gray-400 shrink-0 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
                </button>
                {isOpen && (
                  <div className="ml-11 pl-2 mr-3 mb-3 border-l-2 border-rose-100 space-y-2">
                    {b.expectations_from_students && isLearner && (
                      <div className="bg-rose-50/60 border border-rose-100 rounded-md px-2.5 py-2">
                        <p className="text-[9px] font-semibold text-rose-700 tracking-wider mb-0.5">⚡ READ BEFORE THIS SESSION</p>
                        <p className="text-[11px] text-gray-700 leading-relaxed">{b.expectations_from_students}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-0.5">CALENDAR</p>
                        {b.calendar_event_url ? <a href={b.calendar_event_url} target="_blank" rel="noreferrer" className="text-rose-700 hover:underline">Open event ↗</a> : <p className="text-gray-400">—</p>}
                      </div>
                      <div>
                        <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-0.5">MEETING</p>
                        {b.meeting_url ? <a href={b.meeting_url} target="_blank" rel="noreferrer" className="text-rose-700 hover:underline">Join Meet ↗</a> : <p className="text-gray-400">—</p>}
                      </div>
                    </div>
                    <p className="text-[10px] text-gray-400 italic">Booking #{b.booking_id} · created {b.created_at?.slice(0, 10)}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// GIGS TAB — internal cross-team marketplace
// ──────────────────────────────────────────────────────────────

const POINT_TIERS = [
  { value: 25,  label: "Quick task",  hours: "≤1 hr" },
  { value: 50,  label: "Half-day",    hours: "2–4 hrs" },
  { value: 100, label: "Full day",    hours: "5–10 hrs" },
  { value: 200, label: "Multi-day",   hours: "10–20 hrs" },
  { value: 500, label: "Project",     hours: "20+ hrs" },
];

function GigsTab({ userId }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialView = ["browse", "post", "mine"].includes(searchParams.get("view"))
    ? searchParams.get("view") : "browse";
  const [view, setView] = useState(initialView);
  // Clear ?view after consuming so back-nav behaves
  useEffect(() => {
    if (searchParams.get("view")) {
      const next = new URLSearchParams(searchParams);
      next.delete("view");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [data, setData] = useState(null);
  const [points, setPoints] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [myClaims, setMyClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [skillFilter, setSkillFilter] = useState(null);
  const [pointFilter, setPointFilter] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  async function load() {
    setLoading(true);
    const [list, p, posts, claims] = await Promise.all([
      agent.gigsList(userId, { limit: 100 }),
      agent.gigsPoints(userId),
      agent.gigsMyPosts(userId),
      agent.gigsMyClaims(userId),
    ]);
    setData(list);
    setPoints(p);
    setMyPosts(posts?.gigs || []);
    setMyClaims(claims?.gigs || []);
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [userId]);

  const allGigs = data?.gigs || [];
  const summary = data?.summary || {};

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allGigs.filter(g => {
      if (skillFilter && !(g.skills || []).map(s => s.toLowerCase()).includes(skillFilter.toLowerCase())) return false;
      if (pointFilter && g.point_value !== pointFilter) return false;
      if (!q) return true;
      const blob = [g.title, g.description, g.posted_by_name, g.department_origin,
        ...(g.skills || [])].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [allGigs, query, skillFilter, pointFilter]);

  const topSkills = Object.entries(summary.by_skill || {}).slice(0, 8);

  function flash(msg) { setActionMsg(msg); setTimeout(() => setActionMsg(null), 3500); }

  async function onClaim(gig) {
    const r = await agent.gigsClaim(userId, gig.gig_id);
    if (r?.error) { flash(`✗ ${r.error}`); return; }
    flash(`✓ Claimed "${gig.title}". Deliver when ready in My Claims.`);
    await load();
  }

  async function onDeliver(gig, deliverableUrl, notes) {
    const r = await agent.gigsDeliver(userId, gig.gig_id, { deliverableUrl, notes });
    if (r?.error) { flash(`✗ ${r.error}`); return; }
    flash(`✓ Delivered. Awaiting ${gig.posted_by_name}'s review.`);
    await load();
  }

  async function onReview(gig, decision, notes) {
    const r = await agent.gigsReview(userId, gig.gig_id, decision, notes);
    if (r?.error) { flash(`✗ ${r.error}`); return; }
    if (decision === "accept") {
      flash(`✓ Accepted. ${gig.point_value} pts awarded · auto-Resume entry created.`);
    } else {
      flash(`✗ Declined. Claimer can re-deliver.`);
    }
    await load();
  }

  async function onCancel(gig) {
    if (!confirm(`Cancel gig "${gig.title}"?`)) return;
    const r = await agent.gigsCancel(userId, gig.gig_id);
    if (r?.error) { flash(`✗ ${r.error}`); return; }
    flash(`✓ Cancelled.`);
    await load();
  }

  return (
    <div className="space-y-3">
      {/* HEADER STRIP — points + view toggle */}
      <section className="bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-[10px] font-semibold text-rose-600 tracking-wider">YOUR POINTS</p>
            <p className="text-[24px] font-bold text-rose-700 leading-none mt-0.5">{points?.balance ?? 0}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{points?.earned_count ?? 0} gig{(points?.earned_count ?? 0) === 1 ? "" : "s"} completed</p>
          </div>
          <div className="hidden sm:block h-10 w-px bg-rose-200"></div>
          <div className="hidden sm:block">
            <p className="text-[10px] font-semibold text-gray-500 tracking-wider">MARKET</p>
            <p className="text-[14px] font-semibold text-text-primary leading-tight">{summary.open_count || 0} open · {summary.total_open_points || 0} pts up for grabs</p>
            <p className="text-[10px] text-gray-500">{summary.completed_count || 0} completed all-time</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <ViewBtn active={view === "browse"} onClick={() => setView("browse")} label="Browse" />
          <ViewBtn active={view === "post"}   onClick={() => setView("post")}   label="+ Post" />
          <ViewBtn active={view === "mine"}   onClick={() => setView("mine")}   label={`Mine ${myPosts.length + myClaims.length || ""}`.trim()} />
        </div>
      </section>

      {actionMsg && (
        <div className="text-[11px] bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md px-3 py-2">{actionMsg}</div>
      )}

      {/* BROWSE */}
      {view === "browse" && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, skill, description…"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-rose-400 mb-2"
          />
          <div className="flex flex-wrap gap-1 mb-3">
            <FilterPill active={!skillFilter && !pointFilter} onClick={() => { setSkillFilter(null); setPointFilter(null); }} label={`All ${allGigs.length}`} />
            {POINT_TIERS.map(t => (
              <FilterPill
                key={t.value}
                active={pointFilter === t.value}
                onClick={() => setPointFilter(pointFilter === t.value ? null : t.value)}
                label={`${t.value} pts · ${t.hours}`}
              />
            ))}
            {topSkills.map(([sk, n]) => (
              <FilterPill
                key={sk}
                active={skillFilter === sk}
                onClick={() => setSkillFilter(skillFilter === sk ? null : sk)}
                label={`${sk} ${n}`}
              />
            ))}
          </div>
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-2">
            {filtered.length} of {allGigs.length} gigs{(query || skillFilter || pointFilter) ? " (filtered)" : ""}
          </p>
          {loading && <p className="text-[12px] text-gray-400">Loading gigs…</p>}
          {!loading && filtered.length === 0 && (
            <p className="text-[12px] text-gray-400 italic px-2 py-6 text-center">No gigs match. Try clearing filters or post one yourself.</p>
          )}
          <div className="space-y-1.5">
            {filtered.map(g => {
              const isOpen = expandedId === g.gig_id;
              const mine = g.posted_by === userId;
              const claimed = g.claimed_by === userId;
              return (
                <GigRow
                  key={g.gig_id}
                  gig={g}
                  isOpen={isOpen}
                  mine={mine}
                  claimed={claimed}
                  onToggle={() => setExpandedId(isOpen ? null : g.gig_id)}
                  onClaim={() => onClaim(g)}
                  onDeliver={(url, notes) => onDeliver(g, url, notes)}
                  onCancel={() => onCancel(g)}
                  onReview={(decision, notes) => onReview(g, decision, notes)}
                  userId={userId}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* POST */}
      {view === "post" && (
        <PostGigForm
          userId={userId}
          onPosted={async () => { await load(); setView("mine"); flash("✓ Gig posted."); }}
        />
      )}

      {/* MINE — combined posts + claims */}
      {view === "mine" && (
        <div className="space-y-3">
          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-700 mb-2">📤 GIGS I POSTED · {myPosts.length}</p>
            {myPosts.length === 0 && <p className="text-[11px] text-gray-400 italic">You haven't posted any gigs yet.</p>}
            <div className="space-y-1.5">
              {myPosts.map(g => (
                <GigRow
                  key={`post-${g.gig_id}`}
                  gig={g}
                  isOpen={expandedId === `post-${g.gig_id}`}
                  mine={true}
                  claimed={false}
                  onToggle={() => setExpandedId(expandedId === `post-${g.gig_id}` ? null : `post-${g.gig_id}`)}
                  onClaim={() => onClaim(g)}
                  onDeliver={(url, notes) => onDeliver(g, url, notes)}
                  onCancel={() => onCancel(g)}
                  onReview={(decision, notes) => onReview(g, decision, notes)}
                  userId={userId}
                />
              ))}
            </div>
          </section>

          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[11px] font-semibold text-gray-700 mb-2">📥 GIGS I CLAIMED · {myClaims.length}</p>
            {myClaims.length === 0 && <p className="text-[11px] text-gray-400 italic">You haven't claimed any gigs yet. Browse to find one.</p>}
            <div className="space-y-1.5">
              {myClaims.map(g => (
                <GigRow
                  key={`claim-${g.gig_id}`}
                  gig={g}
                  isOpen={expandedId === `claim-${g.gig_id}`}
                  mine={false}
                  claimed={true}
                  onToggle={() => setExpandedId(expandedId === `claim-${g.gig_id}` ? null : `claim-${g.gig_id}`)}
                  onClaim={() => onClaim(g)}
                  onDeliver={(url, notes) => onDeliver(g, url, notes)}
                  onCancel={() => onCancel(g)}
                  onReview={(decision, notes) => onReview(g, decision, notes)}
                  userId={userId}
                />
              ))}
            </div>
          </section>

          {points?.history?.length > 0 && (
            <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <p className="text-[11px] font-semibold text-gray-700 mb-2">💎 POINTS HISTORY</p>
              <div className="space-y-1">
                {points.history.map((h, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px] py-1">
                    <span className="text-gray-700 truncate flex-1">{h.reason}</span>
                    <span className="font-semibold text-emerald-700 ml-2">+{h.amount}</span>
                    <span className="text-gray-400 text-[9px] ml-2">{(h.ts || "").slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ViewBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`text-[11px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
        active ? "bg-rose-600 text-white" : "bg-white text-gray-600 hover:bg-rose-100 border border-rose-200"
      }`}
    >
      {label}
    </button>
  );
}

function statusToneGig(status) {
  return ({
    open:             "bg-emerald-50 text-emerald-700",
    pending_approval: "bg-amber-50 text-amber-700",
    claimed:          "bg-blue-50 text-blue-700",
    in_progress:      "bg-blue-50 text-blue-700",
    delivered:        "bg-violet-50 text-violet-700",
    completed:        "bg-gray-100 text-gray-600",
    accepted:         "bg-emerald-50 text-emerald-700",
    declined:         "bg-red-50 text-red-700",
    cancelled:        "bg-gray-100 text-gray-500",
    expired:          "bg-gray-100 text-gray-500",
  })[status] || "bg-gray-100 text-gray-600";
}

function GigRow({ gig, isOpen, mine, claimed, onToggle, onClaim, onDeliver, onCancel, onReview, userId }) {
  const [delivUrl, setDelivUrl] = useState("");
  const [delivNotes, setDelivNotes] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");

  const canClaim   = gig.status === "open" && !mine;
  const canDeliver = (gig.status === "claimed" || gig.status === "in_progress") && gig.claimed_by === userId;
  const canReview  = gig.status === "delivered" && mine;
  const canCancel  = mine && !["completed", "cancelled"].includes(gig.status);

  return (
    <div className={`rounded-lg border transition-colors ${isOpen ? "border-rose-300 bg-rose-50/30" : "border-gray-100"}`}>
      <button onClick={onToggle} className="w-full text-left px-3 py-2.5 flex items-start gap-3">
        <div className="w-10 h-10 rounded-md bg-amber-100 text-amber-700 flex flex-col items-center justify-center text-[10px] font-bold shrink-0">
          <span className="text-[12px] leading-none">{gig.point_value}</span>
          <span className="text-[8px] mt-0.5">pts</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[12px] font-semibold text-text-primary truncate">{gig.title}</span>
            <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium shrink-0 ${statusToneGig(gig.status)}`}>{gig.status}</span>
            {mine && <span className="text-[9px] text-rose-600 font-semibold">YOU POSTED</span>}
            {claimed && <span className="text-[9px] text-blue-600 font-semibold">YOU CLAIMED</span>}
          </div>
          <p className="text-[10px] text-gray-500 truncate mt-0.5">
            {gig.posted_by_name} · {gig.department_origin || "—"} · ~{gig.estimated_hours || "?"} hrs
          </p>
          <div className="flex flex-wrap gap-1 mt-1">
            {(gig.skills || []).slice(0, 4).map((sk, j) => (
              <span key={j} className="text-[9px] bg-rose-50 text-rose-700 rounded-full px-1.5 py-0.5">{sk}</span>
            ))}
          </div>
        </div>
        <span className={`text-[9px] text-gray-400 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
      </button>

      {isOpen && (
        <div className="ml-13 pl-3 mr-3 mb-3 border-l-2 border-rose-100 space-y-3">
          <p className="text-[11px] text-gray-700 leading-relaxed">{gig.description}</p>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-0.5">DEADLINE</p>
              <p className="text-gray-700">{gig.deadline_at ? gig.deadline_at.slice(0, 10) : "Open-ended"}</p>
            </div>
            <div>
              <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-0.5">REWARD</p>
              <p className="text-gray-700">{gig.point_value} pts ({POINT_TIERS.find(t => t.value === gig.point_value)?.label || ""})</p>
            </div>
          </div>

          {gig.claimed_by_name && (
            <div className="text-[10px] bg-blue-50 border border-blue-100 rounded-md px-2.5 py-1.5">
              📥 Claimed by <span className="font-semibold">{gig.claimed_by_name}</span>{gig.claimed_at ? ` on ${gig.claimed_at.slice(0, 10)}` : ""}
            </div>
          )}

          {gig.deliverable_url && (
            <div className="text-[10px] bg-violet-50 border border-violet-100 rounded-md px-2.5 py-1.5">
              📦 Delivered: <a href={gig.deliverable_url} target="_blank" rel="noreferrer" className="text-violet-700 hover:underline">{gig.deliverable_url}</a>
              {gig.deliverable_notes && <p className="text-gray-700 mt-0.5">{gig.deliverable_notes}</p>}
            </div>
          )}

          {gig.review_notes && gig.status === "completed" && (
            <div className="text-[10px] bg-emerald-50 border border-emerald-100 rounded-md px-2.5 py-1.5">
              ✓ Endorsed: <span className="italic">"{gig.review_notes}"</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {canClaim && (
              <button onClick={onClaim} className="text-[11px] font-semibold bg-rose-600 text-white hover:bg-rose-700 rounded-md px-3 py-1.5">
                Claim this gig →
              </button>
            )}
            {canDeliver && (
              <div className="w-full bg-blue-50/50 border border-blue-100 rounded-md p-2.5 space-y-1.5">
                <p className="text-[10px] font-semibold text-blue-700">📤 MARK DELIVERED</p>
                <input
                  type="url"
                  placeholder="Deliverable URL (PR, doc, video, etc.)"
                  value={delivUrl}
                  onChange={(e) => setDelivUrl(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-blue-200 text-[11px]"
                />
                <textarea
                  placeholder="Notes for the poster (what you built, how to verify)…"
                  value={delivNotes}
                  onChange={(e) => setDelivNotes(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 rounded border border-blue-200 text-[11px]"
                />
                <button
                  onClick={() => onDeliver(delivUrl, delivNotes)}
                  className="text-[11px] font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-md px-3 py-1.5"
                >
                  Submit delivery
                </button>
              </div>
            )}
            {canReview && (
              <div className="w-full bg-emerald-50/50 border border-emerald-100 rounded-md p-2.5 space-y-1.5">
                <p className="text-[10px] font-semibold text-emerald-700">✓ REVIEW DELIVERY</p>
                <textarea
                  placeholder="Endorsement comment (becomes part of their Resume)…"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-1 rounded border border-emerald-200 text-[11px]"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onReview("accept", reviewNotes)}
                    className="text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 rounded-md px-3 py-1.5"
                  >
                    Accept · award {gig.point_value} pts
                  </button>
                  <button
                    onClick={() => onReview("decline", reviewNotes)}
                    className="text-[11px] font-semibold bg-white text-red-700 border border-red-200 hover:bg-red-50 rounded-md px-3 py-1.5"
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}
            {canCancel && (
              <button onClick={onCancel} className="text-[11px] text-gray-500 hover:text-red-600">
                Cancel gig
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PostGigForm({ userId, onPosted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState("");
  const [department, setDepartment] = useState("");
  const [pointValue, setPointValue] = useState(50);
  const [estimatedHours, setEstimatedHours] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const profile = {
      title: title.trim(),
      description: description.trim(),
      skills: skills.split(",").map(s => s.trim()).filter(Boolean),
      department_origin: department.trim(),
      point_value: pointValue,
      estimated_hours: estimatedHours.trim(),
      deadline_at: deadline ? new Date(deadline).toISOString() : null,
    };
    const r = await agent.gigsPost(userId, profile);
    setSubmitting(false);
    if (r?.error) { setError(r.error); return; }
    onPosted?.(r);
  }

  return (
    <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-[14px] font-bold text-text-primary mb-1">Post a gig</h3>
      <p className="text-[11px] text-gray-500 mb-4">Cross-team work that needs hands. Pick a point value matching the time commitment. Manager+ posts go live immediately; learner posts await approval.</p>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title" required>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Refactor the deploy pipeline's Slack notifications"
            className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[12px]"
            required
          />
        </Field>
        <Field label="Description" required>
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="What needs to be done, why it matters, what 'done' looks like…"
            rows={4}
            className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[12px]"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Skills (comma-separated)" required>
            <input
              value={skills} onChange={(e) => setSkills(e.target.value)}
              placeholder="python, docker, aws"
              className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[12px]"
              required
            />
          </Field>
          <Field label="Department">
            <input
              value={department} onChange={(e) => setDepartment(e.target.value)}
              placeholder="Platform Engineering"
              className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[12px]"
            />
          </Field>
        </div>
        <Field label="Point value (size of the work)" required>
          <div className="grid grid-cols-5 gap-2">
            {POINT_TIERS.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setPointValue(t.value)}
                className={`text-[10px] rounded-md border px-2 py-2 transition-colors ${
                  pointValue === t.value
                    ? "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-gray-200 text-gray-600 hover:border-rose-300"
                }`}
              >
                <p className="font-bold text-[12px]">{t.value}</p>
                <p>{t.label}</p>
                <p className="text-gray-400 text-[9px]">{t.hours}</p>
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Estimated hours">
            <input
              value={estimatedHours} onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="3-4"
              className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[12px]"
            />
          </Field>
          <Field label="Deadline">
            <input
              type="date"
              value={deadline} onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[12px]"
            />
          </Field>
        </div>
        {error && <p className="text-[11px] text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="text-[12px] font-semibold bg-rose-600 text-white hover:bg-rose-700 disabled:bg-gray-300 rounded-md px-4 py-2"
        >
          {submitting ? "Posting…" : "Post gig"}
        </button>
      </form>
    </section>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold text-gray-500 tracking-wider block mb-1">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
