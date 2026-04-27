import DemoSourcesNav from './DemoSourcesNav'

const STEPS = [
  { n: 1, title: 'Linux Fundamentals', source: 'YouTube', dur: '15m', status: 'known', mastery: '0.85', note: 'Refresher available' },
  { n: 2, title: 'Container Basics', source: 'YouTube', dur: '20m', status: 'known', mastery: '0.78', note: 'Refresher available' },
  { n: 3, title: 'Kubernetes Architecture', source: 'Coursera Module 3', dur: '45m', status: 'done', mastery: '0.80', completed: 'Apr 14' },
  { n: 4, title: 'Pods & Deployments', source: 'Coursera Module 4', dur: '40m', status: 'done', mastery: '0.75', completed: 'Apr 18' },
  { n: 5, title: 'Services & Networking', source: 'Coursera Module 5', dur: '50m', status: 'done', mastery: '0.70', completed: 'Apr 22' },
  { n: '5a', title: 'K8s 1.31 topology refresher', source: 'kubernetes.io/blog', dur: '3m', status: 'done', mastery: '0.70', completed: 'today', insertedReason: '⚡ auto: K8s 1.31 deprecated topologyKeys', isInserted: true },
  { n: 6, title: 'Service Mesh with Istio', source: 'LinkedIn Learning', dur: '30m', status: 'done', mastery: '0.70', completed: 'today' },
  { n: '6a', title: 'mTLS Quickstart', source: 'Internal wiki', dur: '10m', status: 'active', insertedReason: '⚡ auto: gap detected during Service Mesh session', isInserted: true },
  { n: 7, title: 'AWS Core Services — EC2, S3, VPC', source: 'LinkedIn Learning', dur: '2h', status: 'pending' },
  { n: 8, title: 'Infrastructure as Code (Terraform)', source: 'Internal wiki + Pluralsight', dur: '90m', status: 'pending' },
  { n: 9, title: 'AWS Lambda & Serverless', source: 'LinkedIn Learning', dur: '60m', status: 'pending' },
  { n: 10, title: 'Cloud Security Foundations', source: 'AWS Security workshop', dur: '90m', status: 'pending', insertedReason: '⚡ auto: gap detected — IAM weak across path', isInserted: true },
  { n: 11, title: 'Migration Patterns', source: 'AWS whitepaper + workshop', dur: '2h', status: 'pending' },
  { n: 12, title: 'AWS SA Pro Practice Exam', source: 'AWS official', dur: '4h', status: 'pending' },
]

const STATUS_META = {
  done: { color: 'bg-green-500 text-white', icon: '✓', label: 'done' },
  known: { color: 'bg-gray-300 text-gray-600', icon: '○', label: 'known' },
  active: { color: 'bg-navy text-white animate-pulse', icon: '→', label: 'active' },
  pending: { color: 'bg-gray-100 text-gray-400', icon: '○', label: 'pending' },
  stale: { color: 'bg-amber-500 text-white', icon: '↻', label: 'stale' },
}

export default function PathDetail({ goalTitle = 'Cloud Architect' }) {
  const completed = STEPS.filter((s) => s.status === 'done').length
  const total = STEPS.length
  const pct = Math.round((completed / total) * 100)

  return (
    <div className="flex h-full w-full bg-bg overflow-hidden">
      <DemoSourcesNav />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <button className="text-[11px] text-gray-400 hover:text-navy mb-2 flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back to My Goals
            </button>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider">LIVE LEARNING PATH</p>
            <h1 className="font-serif text-3xl font-bold text-navy mt-1">{goalTitle}</h1>
            <div className="flex items-center gap-3 mt-3">
              <span className="text-[12px] text-gray-500">{pct}% complete · {completed} of {total} steps</span>
              <span className="text-[10px] text-gray-400">·</span>
              <span className="text-[12px] text-gray-500">ETA at current pace: 8 weeks</span>
            </div>
            <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden max-w-md">
              <div className="h-full bg-gradient-to-r from-navy to-columbia-blue" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Recent recompute callout */}
          <div className="mb-6 px-4 py-3 rounded-xl bg-gold/5 border border-gold/30">
            <p className="text-[10px] text-gold font-bold tracking-wider mb-1">⚡ PATH ENGINE · LAST 7 DAYS</p>
            <p className="text-[12px] text-text-primary leading-relaxed">
              Peraasan made <span className="font-semibold">3 adjustments</span> to your path:
            </p>
            <ul className="text-[12px] text-text-primary mt-1 space-y-1">
              <li>• <span className="font-mono text-[11px] text-gray-500">today</span> — Inserted "mTLS Quickstart" (gap detected during Service Mesh)</li>
              <li>• <span className="font-mono text-[11px] text-gray-500">2d ago</span> — Inserted "K8s 1.31 topology refresher" (breaking change)</li>
              <li>• <span className="font-mono text-[11px] text-gray-500">5d ago</span> — Inserted "Cloud Security Foundations" (IAM gap detected across multiple sessions)</li>
            </ul>
          </div>

          {/* Step list */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            {STEPS.map((step, i) => {
              const meta = STATUS_META[step.status] || STATUS_META.pending
              return (
                <div
                  key={i}
                  className={`flex items-start gap-4 px-5 py-4 ${i !== STEPS.length - 1 ? 'border-b border-gray-50' : ''} ${
                    step.status === 'active' ? 'bg-navy/5' : step.isInserted ? 'bg-gold/5' : ''
                  }`}
                >
                  {/* Step number */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${meta.color}`}>
                    {meta.icon}
                  </div>

                  {/* Step body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-gray-400">Step {step.n}</span>
                      <h4 className={`text-[14px] font-semibold ${step.status === 'done' ? 'text-gray-500 line-through decoration-gray-300' : 'text-text-primary'}`}>
                        {step.title}
                      </h4>
                      {step.isInserted && (
                        <span className="px-1.5 py-0.5 rounded bg-gold/20 text-gold text-[9px] font-bold tracking-wider">
                          ⚡ AUTO-INSERTED
                        </span>
                      )}
                      {step.status === 'active' && (
                        <span className="px-1.5 py-0.5 rounded bg-navy text-white text-[9px] font-bold tracking-wider">
                          YOU ARE HERE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">{step.source} · {step.dur}</p>
                    {step.insertedReason && (
                      <p className="text-[11px] text-gold mt-1 italic">{step.insertedReason}</p>
                    )}
                    {step.note && (
                      <p className="text-[11px] text-gray-400 mt-1">{step.note}</p>
                    )}
                  </div>

                  {/* Step metadata */}
                  <div className="text-right shrink-0">
                    {step.mastery && (
                      <p className="text-[11px] text-gray-500">mastery <span className="font-mono text-text-primary">{step.mastery}</span></p>
                    )}
                    {step.completed && (
                      <p className="text-[10px] text-gray-400">completed {step.completed}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50">
              + Add step manually
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50">
              Pause path
            </button>
            <button className="px-4 py-2 rounded-lg border border-gray-200 text-[12px] text-gray-600 hover:bg-gray-50">
              Force recompute
            </button>
            <p className="ml-auto self-center text-[11px] text-gray-400 italic">
              Manual edits are sacred — Path Engine never overrides them.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
