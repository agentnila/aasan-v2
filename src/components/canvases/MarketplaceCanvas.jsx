import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
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
  const [tab, setTab] = useState("browse");

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
      </div>

      {tab === "browse" && <BrowseTab userId={userId} />}
      {tab === "bookings" && <BookingsTab userId={userId} />}
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
