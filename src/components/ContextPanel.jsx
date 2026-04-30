import { useEffect, useState } from 'react'
import { useUser, UserButton } from '@clerk/clerk-react'
import agent from '../services/agentService'

function FeedEvent({ ev, authorEmail }) {
  const [endorsing, setEndorsing] = useState(false)
  const [done, setDone] = useState(false)
  const [declined, setDeclined] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [comment, setComment] = useState('')
  const [showForm, setShowForm] = useState(false)

  async function submitEndorsement() {
    setEndorsing(true)
    const result = await agent.endorseEntry({
      authorUserId: ev.from_user_id,
      entryId: ev.entry_id,
      endorserEmail: authorEmail,
      endorserName: name,
      endorserRole: role,
      comment,
    })
    if (!result?.error) setDone(true)
    setEndorsing(false)
  }

  async function submitDecline() {
    setEndorsing(true)
    const reason = window.prompt("Decline endorsement — reason? (optional, just hit OK to skip)", "")
    if (reason === null) { setEndorsing(false); return }
    const result = await agent.declineEndorsement({
      authorUserId: ev.from_user_id,
      entryId: ev.entry_id,
      endorserEmail: authorEmail,
      reason,
    })
    if (!result?.error) setDeclined(true)
    setEndorsing(false)
  }

  if (ev.type === 'shared_entry') {
    return (
      <div className="px-2 py-1.5 rounded-md border border-gray-100 bg-blue-50/30">
        <p className="text-[10px] text-blue-700 font-semibold tracking-wider mb-0.5">📤 SHARED WITH YOU</p>
        <p className="text-[11px] font-medium text-text-primary leading-snug">{ev.entry_title}</p>
        <p className="text-[9px] text-gray-500 mt-0.5">
          from {ev.from_user_id}
          {ev.entry_company && ` · 🏢 ${ev.entry_company}`}
          {ev.entry_project && ` · 📁 ${ev.entry_project}`}
        </p>
        {(ev.entry_outcomes || []).slice(0, 1).map((o, i) => (
          <p key={i} className="text-[10px] text-gray-600 mt-1 italic">"· {o}"</p>
        ))}
      </div>
    )
  }
  if (ev.type === 'endorsement_requested') {
    return (
      <div className="px-2 py-1.5 rounded-md border border-amber-200 bg-amber-50/40">
        <p className="text-[10px] text-amber-700 font-semibold tracking-wider mb-0.5">⭐ ENDORSEMENT REQUEST</p>
        <p className="text-[11px] font-medium text-text-primary leading-snug">{ev.entry_title}</p>
        <p className="text-[9px] text-gray-500 mt-0.5">
          from {ev.from_user_id}
          {ev.entry_company && ` · 🏢 ${ev.entry_company}`}
        </p>
        {done ? (
          <p className="text-[10px] text-emerald-700 mt-1 font-semibold">✓ Endorsed</p>
        ) : declined ? (
          <p className="text-[10px] text-gray-500 mt-1 font-semibold italic">Declined</p>
        ) : showForm ? (
          <div className="mt-2 space-y-1.5">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="w-full px-2 py-1 rounded border border-amber-200 text-[10px]" />
            <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Your role/title" className="w-full px-2 py-1 rounded border border-amber-200 text-[10px]" />
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment…" rows={2} className="w-full px-2 py-1 rounded border border-amber-200 text-[10px] resize-none" />
            <div className="flex gap-1.5">
              <button onClick={submitEndorsement} disabled={endorsing || !name.trim()} className={`flex-1 text-[10px] font-semibold rounded-md py-1 ${endorsing || !name.trim() ? 'bg-amber-200 text-amber-400' : 'bg-amber-600 text-white hover:bg-amber-700'}`}>
                {endorsing ? 'Submitting…' : '✓ Endorse'}
              </button>
              <button onClick={() => setShowForm(false)} className="text-[10px] text-gray-500 hover:text-gray-700 px-2">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex gap-1.5 mt-1.5">
            <button onClick={() => setShowForm(true)} disabled={endorsing} className="text-[10px] font-semibold bg-amber-600 text-white hover:bg-amber-700 rounded-md px-2 py-1">
              ⭐ Endorse →
            </button>
            <button onClick={submitDecline} disabled={endorsing} className="text-[10px] font-semibold border border-gray-300 text-gray-500 hover:bg-gray-50 rounded-md px-2 py-1">
              Decline
            </button>
          </div>
        )}
      </div>
    )
  }
  if (ev.type === 'endorsement_received') {
    return (
      <div className="px-2 py-1.5 rounded-md border border-emerald-200 bg-emerald-50/40">
        <p className="text-[10px] text-emerald-700 font-semibold tracking-wider mb-0.5">✓ ENDORSED YOU</p>
        <p className="text-[11px] font-medium text-text-primary leading-snug">{ev.from_user_name || ev.from_user_email}{ev.from_user_role && <span className="font-normal text-gray-500"> · {ev.from_user_role}</span>}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">on "{ev.entry_title}"</p>
        {ev.comment && <p className="text-[10px] text-gray-700 italic mt-1">"{ev.comment}"</p>}
      </div>
    )
  }
  if (ev.type === 'endorsement_declined') {
    return (
      <div className="px-2 py-1.5 rounded-md border border-gray-200 bg-gray-50">
        <p className="text-[10px] text-gray-500 font-semibold tracking-wider mb-0.5">— ENDORSEMENT DECLINED</p>
        <p className="text-[11px] font-medium text-text-primary leading-snug">{ev.from_user_email}</p>
        <p className="text-[10px] text-gray-500 mt-0.5">on "{ev.entry_title}"</p>
        {ev.reason && <p className="text-[10px] text-gray-600 italic mt-1">"{ev.reason}"</p>}
      </div>
    )
  }
  return null
}

function getSavedGoal() {
  try {
    return JSON.parse(localStorage.getItem('aasan_goal') || 'null');
  } catch { return null; }
}

function formatBlockTime(startIso, endIso) {
  try {
    const s = new Date(startIso)
    const e = new Date(endIso)
    const today = new Date()
    const isToday = s.toDateString() === today.toDateString()
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
    const isTomorrow = s.toDateString() === tomorrow.toDateString()
    const dayLabel = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : s.toLocaleDateString(undefined, { weekday: 'short' })
    const fmt = (d) => d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${dayLabel} ${fmt(s)} – ${fmt(e)}`
  } catch { return startIso }
}

export default function ContextPanel({ data, context, contextLoading }) {
  const { user } = useUser()
  const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Employee'
  const email = user?.primaryEmailAddress?.emailAddress || ''

  // Real data from backend, with fallbacks
  const totalConcepts = context?.knowledge?.total_concepts ?? '--'
  const gaps = context?.knowledge?.gaps ?? '--'
  const avgMastery = context?.knowledge?.avg_mastery != null ? Math.round(context.knowledge.avg_mastery) : '--'
  const reviewsDue = context?.reviews_due || []
  // memories stored for Peraasan use
  const _memories = context?.memories || []
  const upcomingBlocks = context?.schedule?.upcoming || []
  const conflictPending = context?.schedule?.conflict_pending || []

  // Resume activity feed (peer events: shared / endorsement_requested / endorsement_received)
  const [feedEvents, setFeedEvents] = useState([])
  const [feedLoading, setFeedLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    if (!email) { setFeedLoading(false); return }
    agent.getResumeFeed(email, { limit: 8 }).then((result) => {
      if (cancelled) return
      setFeedEvents(result?.events || [])
      setFeedLoading(false)
    })
    // Refresh every 30s
    const t = setInterval(() => {
      if (cancelled) return
      agent.getResumeFeed(email, { limit: 8 }).then((result) => {
        if (cancelled) return
        setFeedEvents(result?.events || [])
      })
    }, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [email])

  // Goal from localStorage (set during onboarding)
  const savedGoal = getSavedGoal()

  return (
    <aside className="w-[320px] min-w-[320px] bg-white border-l border-gray-100 flex flex-col overflow-y-auto no-scrollbar">
      {/* Header — Profile with Clerk UserButton */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-center gap-2.5">
          <UserButton
            appearance={{
              elements: { avatarBox: 'w-9 h-9' }
            }}
            userProfileMode="modal"
            afterSignOutUrl="/"
          />
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-text-primary">{displayName}</p>
            <p className="text-[10px] text-gray-400 truncate">{email}</p>
          </div>
        </div>
      </div>

      {/* Goal */}
      <div className="px-5 py-4 border-b border-gray-50">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">CURRENT GOAL</p>
        {savedGoal ? (
          <>
            <p className="text-[13px] font-semibold text-text-primary">{savedGoal.goal}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">By {savedGoal.timeline} · {savedGoal.criteria}</p>
            <div className="flex items-center gap-2 mt-2.5">
              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div className="bg-navy rounded-full h-2" style={{ width: `${context?.readiness || 0}%` }} />
              </div>
              <span className="text-[11px] font-bold text-navy">{context?.readiness || 0}</span>
            </div>
            <p className="text-[9px] text-gray-400 mt-1.5">{savedGoal.objective}</p>
          </>
        ) : (
          <p className="text-[10px] text-gray-400">No goal set yet — chat with Peraasan to set one</p>
        )}
      </div>

      {/* Dynamic content based on conversation */}
      {data.type === "learning_path" && (
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">LEARNING PATH</p>
          <div className="flex flex-col gap-1.5">
            {["Container Basics ✓", "Pod Architecture ✓", "Services & Networking ←", "Deployments", "Helm"].map((step, i) => (
              <div key={i} className={`text-[11px] flex items-center gap-2 ${i < 2 ? "text-gray-400" : i === 2 ? "text-navy font-medium" : "text-gray-400"}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${i < 2 ? "bg-green-400" : i === 2 ? "bg-navy" : "bg-gray-200"}`} />
                {step}
              </div>
            ))}
          </div>
        </div>
      )}

      {data.type === "progress" && (
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">SKILL BREAKDOWN</p>
          <div className="flex flex-col gap-2">
            {[
              { name: "Kubernetes", score: 72, color: "bg-navy" },
              { name: "AWS", score: 55, color: "bg-gold" },
              { name: "Networking", score: 38, color: "bg-red-400" },
              { name: "IaC", score: 45, color: "bg-columbia-blue" },
            ].map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between text-[10px] mb-0.5">
                  <span className="text-gray-500">{skill.name}</span>
                  <span className="font-semibold text-text-primary">{skill.score}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div className={`${skill.color} rounded-full h-1.5`} style={{ width: `${skill.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity feed — peer events from Resume Service Record */}
      <div className="px-5 py-4 border-b border-gray-50">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider">📡 ACTIVITY FEED</p>
          {feedEvents.length > 0 && (
            <span className="text-[9px] text-gray-400 font-mono">{feedEvents.length}</span>
          )}
        </div>
        {feedLoading && <p className="text-[10px] text-gray-400 italic">Loading…</p>}
        {!feedLoading && feedEvents.length === 0 && (
          <p className="text-[10px] text-gray-400 italic leading-relaxed">
            No peer activity yet. When a peer shares an entry or asks for your endorsement, it shows up here.
          </p>
        )}
        <div className="space-y-2">
          {feedEvents.map((ev) => <FeedEvent key={ev.feed_id} ev={ev} authorEmail={email} />)}
        </div>
      </div>

      {/* Upcoming learning blocks (V3 — Project Manager Mode) */}
      {(upcomingBlocks.length > 0 || conflictPending.length > 0) && (
        <div className="px-5 py-4 border-b border-gray-50">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">UPCOMING LEARNING BLOCKS</p>
          {upcomingBlocks.slice(0, 3).map((b) => (
            <div key={b.block_id} className="flex items-start gap-2 mb-2 last:mb-0">
              <div className="w-1.5 h-1.5 rounded-full bg-navy mt-1.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-text-primary truncate">{b.step_title}</p>
                <p className="text-[9px] text-gray-400">{formatBlockTime(b.start_at, b.end_at)}</p>
              </div>
            </div>
          ))}
          {conflictPending.length > 0 && (
            <div className="mt-2 px-2 py-1.5 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-[10px] text-amber-700 font-medium">
                {conflictPending.length} block{conflictPending.length > 1 ? 's' : ''} now conflict with another meeting — Peraasan will offer a reschedule
              </p>
            </div>
          )}
        </div>
      )}

      {/* Knowledge Stats — Real data from backend */}
      <div className="px-5 py-4 border-b border-gray-50">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">YOUR KNOWLEDGE</p>
        {contextLoading ? (
          <div className="text-[11px] text-gray-400 py-2">Loading...</div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-[16px] font-bold text-text-primary">{totalConcepts}</p>
              <p className="text-[8px] text-gray-400">concepts</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-[16px] font-bold text-red-500">{gaps}</p>
              <p className="text-[8px] text-gray-400">gaps</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-[16px] font-bold text-gold">{avgMastery}</p>
              <p className="text-[8px] text-gray-400">mastery</p>
            </div>
          </div>
        )}
      </div>

      {/* Reviews due — real data from backend */}
      <div className="px-5 py-4 border-b border-gray-50">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2">REVIEWS DUE</p>
        <div className="flex flex-col gap-1.5">
          {reviewsDue.length > 0 ? (
            reviewsDue.map((review, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                <span className="text-text-primary">{review.concept_name || review.name || review}</span>
              </div>
            ))
          ) : (
            <p className="text-[10px] text-gray-400">
              {contextLoading ? 'Loading...' : 'No reviews due right now'}
            </p>
          )}
        </div>
      </div>


      {/* Live Activity Feed */}
      <div className="px-5 py-4 flex-1">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-3">FEED</p>
        <div className="flex flex-col gap-3">
          {feedItems.map((item, i) => (
            <FeedItem key={i} item={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}

const feedItems = [
  {
    type: "peer",
    icon: "👤",
    color: "bg-columbia-blue/10",
    content: "James completed AWS EC2 Fundamentals",
    detail: "Your teammate is 2 steps ahead on the Cloud path",
    time: "10 min ago",
  },
  {
    type: "kudos",
    icon: "🎉",
    color: "bg-gold/10",
    content: "Kudos from Raj: \"Great progress on Kubernetes this week, Sarah!\"",
    detail: null,
    time: "1h ago",
  },
  {
    type: "new_content",
    icon: "🆕",
    color: "bg-green-50",
    content: "New course published: Advanced Service Mesh with Istio",
    detail: "Coursera · Relevant to your Cloud Architect path",
    time: "2h ago",
  },
  {
    type: "manager",
    icon: "💬",
    color: "bg-navy/5",
    content: "Raj shared: \"Incident Postmortem Template v2\"",
    detail: "Added to your team's learning resources",
    time: "3h ago",
  },
  {
    type: "company",
    icon: "🏢",
    color: "bg-purple-50",
    content: "Company announcement: Cloud migration deadline moved to Q3",
    detail: "Your Cloud Architect goal is now higher priority",
    time: "5h ago",
  },
  {
    type: "success",
    icon: "🏆",
    color: "bg-gold/10",
    content: "Priya earned AWS Solutions Architect certification!",
    detail: "She studied for 8 weeks using Aasan",
    time: "Yesterday",
  },
  {
    type: "peer",
    icon: "👤",
    color: "bg-columbia-blue/10",
    content: "3 people on your team learned Kubernetes this week",
    detail: "Platform Engineering team readiness: 58 → 62",
    time: "Yesterday",
  },
  {
    type: "news",
    icon: "📰",
    color: "bg-gray-50",
    content: "Kubernetes 1.30 released — new Gateway API features",
    detail: "Relevant to your learning path · Peraasan will update content",
    time: "Yesterday",
  },
  {
    type: "new_content",
    icon: "🆕",
    color: "bg-green-50",
    content: "Your team's Confluence updated: Production Runbook v3",
    detail: "Peraasan indexed 5 new sections relevant to your goals",
    time: "2 days ago",
  },
  {
    type: "kudos",
    icon: "🎉",
    color: "bg-gold/10",
    content: "You hit an 8-day learning streak!",
    detail: "You're in the top 15% of learners at TechCorp",
    time: "2 days ago",
  },
];

function FeedItem({ item }) {
  return (
    <div className={`${item.color} rounded-lg p-2.5 hover:shadow-sm transition-all cursor-pointer`}>
      <div className="flex items-start gap-2">
        <span className="text-[12px] shrink-0 mt-0.5">{item.icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-text-primary leading-snug">
            {item.content}
          </p>
          {item.detail && (
            <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">
              {item.detail}
            </p>
          )}
          <p className="text-[9px] text-gray-300 mt-1">{item.time}</p>
        </div>
      </div>
    </div>
  );
}
