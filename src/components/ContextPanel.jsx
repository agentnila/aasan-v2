import { useUser, UserButton } from '@clerk/clerk-react'

function getSavedGoal() {
  try {
    return JSON.parse(localStorage.getItem('aasan_goal') || 'null');
  } catch { return null; }
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
