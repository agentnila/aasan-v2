import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import agent from "../../services/agentService";

/**
 * Admin Console — Internal Pilot Pack · Phase A.
 *
 * Routed via the Settings cog at the bottom of ModuleRail (NOT a top-level
 * rail icon — keeps the rail at 7 modules per the IA memory). Only loads
 * for users with the `org_admin` role; everyone else gets a 403-style
 * "you don't have access" surface.
 *
 * V1 scope: People tab only. Modules / SSO / Branding / Billing are
 * sibling tabs reserved for following ships.
 */

const ROLE_LABELS = {
  learner:          { label: "Learner",          tone: "bg-gray-100 text-gray-700" },
  manager:          { label: "Manager",          tone: "bg-amber-100 text-amber-700" },
  skip_manager:     { label: "Skip-level",       tone: "bg-amber-50 text-amber-600" },
  ld_admin:         { label: "L&D Admin",        tone: "bg-blue-100 text-blue-700" },
  compliance_admin: { label: "Compliance Admin", tone: "bg-violet-100 text-violet-700" },
  org_admin:        { label: "Org Admin",        tone: "bg-rose-100 text-rose-700" },
  super_admin:      { label: "Super Admin",      tone: "bg-rose-200 text-rose-800" },
};
const ALL_ROLES = Object.keys(ROLE_LABELS);

export default function AdminCanvas() {
  const { user } = useUser();
  const actorId = user?.id || "demo-user";

  const [me, setMe] = useState(null);
  const [users, setUsers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("people");
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  async function loadMe() {
    const data = await agent.getMe(actorId);
    setMe(data);
  }
  async function loadUsers() {
    setLoading(true);
    const data = await agent.adminListUsers(actorId, { filterRole, search });
    setUsers(data);
    setLoading(false);
  }

  useEffect(() => { loadMe(); }, []);
  useEffect(() => { if (me?.is_admin) loadUsers(); }, [me, filterRole, search]);

  async function handleSetRole(target, newRole) {
    setBusyId(target.user_id);
    await agent.adminSetRole(actorId, target.user_id, newRole);
    await loadUsers();
    setBusyId(null);
  }

  async function downloadSampleCsv() {
    const result = await agent.adminUsersCsvSample(actorId);
    const blob = new Blob([result.csv || ""], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aasan-users-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleFileChosen(file) {
    if (!file) return;
    const text = await file.text();
    setImportText(text);
  }

  async function submitImport() {
    if (!importText.trim()) return;
    setImporting(true);
    setImportResult(null);
    const result = await agent.adminImportUsersCsv(actorId, importText);
    setImportResult(result);
    setImporting(false);
    if (result?.ok) {
      await loadUsers();
    }
  }

  // 403-style surface — non-admins still see the canvas (we routed them here)
  if (me && !me.is_admin) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm max-w-2xl">
        <div className="text-[40px] mb-2">🔒</div>
        <h1 className="text-[22px] font-bold text-text-primary tracking-tight mb-1">Admin Console</h1>
        <p className="text-[13px] text-gray-500 leading-relaxed mb-3">
          You don't have access to this surface.
        </p>
        <p className="text-[12px] text-gray-700">
          Your role is <span className="font-semibold">{ROLE_LABELS[me.role]?.label || me.role}</span>. The Admin Console is reserved for <span className="font-semibold">Org Admin</span> + <span className="font-semibold">Super Admin</span>. Ping your IT administrator if you need access.
        </p>
      </div>
    );
  }

  const list = users?.users || [];
  const filtered = list;
  const byRole = users?.by_role || {};

  return (
    <div className="space-y-5">
      <header>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">⚙ Admin Console</h1>
          <span className="text-[11px] text-gray-400">Internal Pilot Pack — Job-1 deployment</span>
          {me && (
            <span className="ml-auto text-[10px] text-gray-500">
              Signed in as <span className="font-semibold text-text-primary">{me.name}</span> · <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium ${ROLE_LABELS[me.role]?.tone || "bg-gray-100"}`}>{ROLE_LABELS[me.role]?.label || me.role}</span>
            </span>
          )}
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
          People · roles · modules · SSO · branding · audit log. V1 ships People; the rest follow as the Internal Pilot Pack continues.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <Tab active={tab === "people"}   onClick={() => setTab("people")}   label="👥 People"   count={users?.total} />
        <Tab active={tab === "reports"}  onClick={() => setTab("reports")}  label="📊 Reports" />
        <Tab active={tab === "heatmap"}  onClick={() => setTab("heatmap")}  label="🌡 Skill heatmap" />
        <Tab active={tab === "audit"}    onClick={() => setTab("audit")}    label="📋 Audit log" />
        <Tab active={tab === "modules"}  onClick={() => setTab("modules")}  label="📦 Modules"  badge="soon" />
        <Tab active={tab === "sso"}      onClick={() => setTab("sso")}      label="🔐 SSO"       badge="soon" />
        <Tab active={tab === "branding"} onClick={() => setTab("branding")} label="🎨 Branding"  badge="soon" />
        <Tab active={tab === "billing"}  onClick={() => setTab("billing")}  label="💳 Billing"   badge="soon" />
      </div>

      {tab === "people" && (
        <>
          {/* Stats strip */}
          <section className="grid grid-cols-4 gap-3">
            <Stat label="Total users" value={users?.total ?? "—"} />
            <Stat label="Org admins" value={byRole.org_admin || 0} />
            <Stat label="Managers" value={(byRole.manager || 0) + (byRole.skip_manager || 0)} />
            <Stat label="Learners" value={byRole.learner || 0} />
          </section>

          {/* Filters */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email…"
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-rose-400"
              />
              <select
                value={filterRole || ""}
                onChange={(e) => setFilterRole(e.target.value || null)}
                className="px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-rose-400 bg-white"
              >
                <option value="">All roles</option>
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>{ROLE_LABELS[r].label}</option>
                ))}
              </select>
              <button
                onClick={() => { setImportOpen(!importOpen); setImportResult(null); }}
                className={`text-[11px] font-semibold rounded-md px-2.5 py-2 transition-colors ${
                  importOpen ? "bg-rose-600 text-white" : "bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
                }`}
              >
                📥 {importOpen ? "Close import" : "CSV import"}
              </button>
              <button
                disabled
                className="text-[11px] font-semibold bg-gray-100 text-gray-400 rounded-md px-2.5 py-2 cursor-not-allowed"
                title="Invite user — landing in SCIM phase"
              >
                + Invite (soon)
              </button>
            </div>
          </section>

          {/* CSV import inline panel */}
          {importOpen && (
            <section className="bg-white border border-rose-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-[10px] text-rose-700 font-bold tracking-wider">📥 BULK IMPORT USERS FROM CSV</p>
                <button onClick={downloadSampleCsv} className="text-[11px] text-rose-700 hover:underline font-semibold">
                  ↓ Download sample CSV
                </button>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                Required column: <code className="text-[10px] bg-gray-100 px-1 rounded">email</code>. Optional:
                <code className="text-[10px] bg-gray-100 px-1 rounded ml-1">name</code>
                <code className="text-[10px] bg-gray-100 px-1 rounded ml-1">role</code>
                <code className="text-[10px] bg-gray-100 px-1 rounded ml-1">department</code>
                <code className="text-[10px] bg-gray-100 px-1 rounded ml-1">manager_email</code>
                <code className="text-[10px] bg-gray-100 px-1 rounded ml-1">is_active</code>.
                Idempotent on email — existing users update, new users create. <span className="font-semibold">Manager email links resolve in a second pass</span>, so you can import a whole org in one shot.
              </p>

              <div className="flex items-center gap-2 mb-2">
                <label className="text-[11px] font-semibold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md px-2.5 py-1.5 cursor-pointer transition-colors">
                  Choose file…
                  <input type="file" accept=".csv,text/csv" onChange={(e) => handleFileChosen(e.target.files?.[0])} className="hidden" />
                </label>
                <p className="text-[10px] text-gray-400 italic">…or paste content below</p>
              </div>

              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="email,name,role,department,manager_email,is_active&#10;sarah@example.com,Sarah Chen,manager,Platform,balaji@example.com,true&#10;…"
                rows={8}
                disabled={importing}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[11px] font-mono focus:outline-none focus:border-rose-400 resize-y mb-2"
              />

              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400 italic">{importText.split("\n").filter(l => l.trim()).length} lines (incl. header)</p>
                <button
                  onClick={submitImport}
                  disabled={importing || !importText.trim()}
                  className={`text-[12px] font-semibold rounded-md px-3 py-1.5 transition-colors ${
                    importing ? "bg-rose-100 text-rose-400 cursor-wait"
                      : !importText.trim() ? "bg-rose-200 text-rose-400 cursor-not-allowed"
                      : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}
                >
                  {importing ? "Importing…" : "✓ Import users"}
                </button>
              </div>

              {importResult && !importResult.error && (
                <div className="mt-4 grid grid-cols-4 gap-2">
                  <ResultStat label="Created" value={importResult.created} tone="emerald" />
                  <ResultStat label="Updated" value={importResult.updated} tone="blue" />
                  <ResultStat label="Skipped" value={importResult.skipped} tone={importResult.skipped > 0 ? "amber" : "neutral"} />
                  <ResultStat label="Errors" value={(importResult.errors || []).length} tone={(importResult.errors || []).length > 0 ? "red" : "neutral"} />
                </div>
              )}
              {importResult?.manager_links_resolved_in_second_pass > 0 && (
                <p className="mt-2 text-[10px] text-gray-500 italic">↩ {importResult.manager_links_resolved_in_second_pass} manager_email link{importResult.manager_links_resolved_in_second_pass === 1 ? "" : "s"} resolved in second pass.</p>
              )}
              {importResult?.error && (
                <p className="mt-3 text-[11px] text-red-600">Error: {importResult.error}</p>
              )}
              {(importResult?.errors || []).length > 0 && (
                <div className="mt-3">
                  <p className="text-[9px] font-semibold text-amber-700 tracking-wider mb-1">⚠ ROW-LEVEL ISSUES · {importResult.errors.length}</p>
                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                    {importResult.errors.map((e, i) => (
                      <p key={i} className="text-[10px] text-gray-700 px-2 py-1 bg-amber-50/60 border border-amber-100 rounded">
                        {e.row != null && <span className="font-mono text-gray-500">row {e.row}</span>}
                        {e.email && <span className="font-mono text-gray-500">{e.row != null ? " · " : ""}{e.email}</span>}
                        <span className="ml-1.5">{e.error}</span>
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* People table */}
          <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
              <p className="col-span-3 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">User</p>
              <p className="col-span-3 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">Email</p>
              <p className="col-span-2 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">Department</p>
              <p className="col-span-2 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">Role</p>
              <p className="col-span-2 text-[9px] font-semibold text-gray-400 tracking-wider uppercase text-right">Last active</p>
            </div>
            {loading && <p className="px-4 py-6 text-[12px] text-gray-400">Loading users…</p>}
            {!loading && filtered.length === 0 && (
              <p className="px-4 py-6 text-[12px] text-gray-400 italic">No users match.</p>
            )}
            {!loading && filtered.map((u) => {
              const meta = ROLE_LABELS[u.role] || { label: u.role, tone: "bg-gray-100 text-gray-700" };
              const isSelf = u.user_id === actorId;
              const initials = (u.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
              return (
                <div key={u.user_id} className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/40">
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px] font-bold shrink-0">{initials}</div>
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-text-primary truncate">{u.name}{isSelf && <span className="ml-1 text-[9px] text-gray-400 font-normal">(you)</span>}</p>
                      <p className="text-[9px] text-gray-400 font-mono truncate">{u.user_id}</p>
                    </div>
                  </div>
                  <p className="col-span-3 text-[11px] text-gray-700 truncate">{u.email}</p>
                  <p className="col-span-2 text-[11px] text-gray-700 truncate">{u.department || <span className="text-gray-400 italic">—</span>}</p>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className={`text-[10px] rounded-full px-2 py-0.5 font-medium ${meta.tone}`}>{meta.label}</span>
                    <select
                      value={u.role}
                      onChange={(e) => handleSetRole(u, e.target.value)}
                      disabled={busyId === u.user_id || isSelf}
                      title={isSelf ? "You can't change your own role" : "Change role"}
                      className="text-[10px] rounded-md border border-gray-200 bg-white px-1.5 py-0.5 focus:outline-none focus:border-rose-400 disabled:opacity-40"
                    >
                      {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r].label}</option>)}
                    </select>
                  </div>
                  <p className="col-span-2 text-[10px] text-gray-500 text-right truncate">{fmtRelativeDate(u.last_active_at)}</p>
                </div>
              );
            })}
          </section>
        </>
      )}

      {tab === "reports" && <ReportsTab actorId={actorId} />}
      {tab === "heatmap" && <SkillHeatmapTab actorId={actorId} />}
      {tab === "audit" && <AuditLogTab actorId={actorId} />}
      {tab !== "people" && tab !== "audit" && tab !== "reports" && tab !== "heatmap" && <SoonStub tab={tab} />}
    </div>
  );
}

function Tab({ active, onClick, label, count, badge }) {
  return (
    <button
      onClick={onClick}
      disabled={!!badge}
      className={`text-[12px] font-semibold px-4 py-2.5 transition-all border-b-2 ${
        active ? "border-rose-600 text-rose-700"
          : badge ? "border-transparent text-gray-400 cursor-not-allowed"
          : "border-transparent text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
      {count != null && <span className="opacity-60 ml-1">{count}</span>}
      {badge && <span className="ml-1.5 text-[8px] uppercase tracking-wider bg-gray-100 text-gray-500 rounded-full px-1.5 py-0.5">{badge}</span>}
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
      <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-0.5 uppercase">{label}</p>
      <p className="text-[22px] font-bold text-text-primary leading-none">{value}</p>
    </div>
  );
}

function SoonStub({ tab }) {
  const labels = {
    modules:  { icon: "📦", title: "Modules",   pitch: "Toggle modules per role and per SKU. Resume-only users won't see Library / Marketplace icons; full-suite users see everything. Wires the rail's icon visibility to the user's plan." },
    sso:      { icon: "🔐", title: "SSO",       pitch: "Okta SAML metadata · allowed domains · session policies · IP allowlists. Ships with SCIM provisioning so adding/removing 500 users is one config in Okta." },
    branding: { icon: "🎨", title: "Branding",   pitch: "Workspace name · logo · primary color · email-from address. Slack-style — minor visual polish that makes the app feel like the customer's own." },
    billing:  { icon: "💳", title: "Billing",    pitch: "Seat count + plan + invoices via Stripe. Per-SKU pricing (Resume / Stay Ahead / Library / Career OS) once external buyers come — internal pilot doesn't need this yet." },
    audit:    { icon: "📋", title: "Audit log",  pitch: "Immutable log of who did what, when. Searchable + exportable as CSV. Foundation for SOC 2 even though we're not auditing yet." },
  }[tab] || { icon: "🔧", title: tab, pitch: "Coming next." };
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <div className="text-[28px] mb-1.5">{labels.icon}</div>
      <p className="text-[16px] font-bold text-text-primary mb-1">{labels.title}</p>
      <p className="text-[12px] text-gray-600 leading-relaxed">{labels.pitch}</p>
      <p className="text-[10px] text-gray-400 italic mt-3">Internal Pilot Pack · landing in the next 2 weeks.</p>
    </div>
  );
}

function SkillHeatmapTab({ actorId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCell, setActiveCell] = useState(null); // {dept, skill}

  async function load() {
    setLoading(true);
    const result = await agent.adminSkillHeatmap(actorId);
    setData(result);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const skills = data?.skill_clusters || [];
  const depts = data?.departments || [];
  const matrix = data?.matrix || [];
  const cellUsers = data?.cell_users || {};
  const supply = data?.supply || { content: {}, smes: {} };
  const demandTotal = data?.demand_total || {};
  const gaps = data?.gaps || [];
  const summary = data?.summary || {};

  // Find max for color intensity
  const maxCount = Math.max(1, ...matrix.flat());
  function intensity(count) {
    if (count === 0) return "bg-gray-50 text-gray-300";
    const ratio = count / maxCount;
    if (ratio > 0.66) return "bg-rose-700 text-white";
    if (ratio > 0.33) return "bg-rose-500 text-white";
    return "bg-rose-200 text-rose-900";
  }

  const activeUsers = activeCell ? (cellUsers[activeCell.dept]?.[activeCell.skill] || []) : [];

  return (
    <>
      {/* Stats strip */}
      <section className="grid grid-cols-5 gap-3">
        <Stat label="Users in scope" value={summary.users_in_scope ?? "—"} />
        <Stat label="Skills tracked" value={summary.skill_clusters_tracked ?? "—"} />
        <Stat label="Total demand" value={summary.total_demand ?? "—"} />
        <Stat label="Content items" value={summary.total_content_items ?? "—"} />
        <Stat label="Gaps detected" value={summary.gaps_detected ?? "—"} tone={summary.gaps_detected > 0 ? "amber" : "neutral"} />
      </section>

      {loading && <p className="text-[12px] text-gray-400">Building org-level skill heatmap…</p>}

      {!loading && skills.length === 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm text-center">
          <div className="text-[28px] mb-2">🌡</div>
          <p className="text-[14px] font-bold text-text-primary mb-1">No skill data yet</p>
          <p className="text-[12px] text-gray-500 leading-relaxed max-w-md mx-auto">
            People need to set goals or learning paths for the heatmap to populate. Index content via Library so the supply side has values too.
          </p>
        </section>
      )}

      {!loading && skills.length > 0 && (
        <>
          {/* Heatmap */}
          <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm overflow-x-auto">
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">DEMAND HEATMAP · DEPARTMENTS × SKILL CLUSTERS</p>
            <table className="border-collapse text-[10px]">
              <thead>
                <tr>
                  <th className="text-left py-1.5 pr-2 sticky left-0 bg-white z-10 font-semibold text-gray-400 tracking-wider min-w-[140px]">Department</th>
                  {skills.map((s) => (
                    <th key={s} className="text-center px-1 py-1.5 font-mono text-rose-700 min-w-[64px]" title={s}>
                      <div className="rotate-[-45deg] origin-left translate-y-2 whitespace-nowrap">{s}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {depts.map((d, i) => (
                  <tr key={d}>
                    <td className="py-1 pr-2 sticky left-0 bg-white z-10 text-[11px] font-semibold text-text-primary truncate max-w-[200px]">{d}</td>
                    {skills.map((s, j) => {
                      const count = matrix[i]?.[j] || 0;
                      const isActive = activeCell?.dept === d && activeCell?.skill === s;
                      return (
                        <td key={`${d}-${s}`} className="px-0.5 py-0.5">
                          <button
                            onClick={() => count > 0 && setActiveCell(isActive ? null : { dept: d, skill: s })}
                            disabled={count === 0}
                            className={`w-full h-8 rounded text-[11px] font-bold transition-all ${intensity(count)} ${
                              count > 0 ? "hover:ring-2 hover:ring-rose-400 cursor-pointer" : "cursor-default"
                            } ${isActive ? "ring-2 ring-rose-700" : ""}`}
                            title={`${d} · ${s}: ${count} ${count === 1 ? "person" : "people"}`}
                          >
                            {count || ""}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Supply rows */}
                <tr className="border-t-2 border-gray-200">
                  <td className="py-1.5 pr-2 sticky left-0 bg-white z-10 text-[10px] font-semibold text-gray-500 italic">📚 Content</td>
                  {skills.map((s) => (
                    <td key={`content-${s}`} className="px-0.5 py-1 text-center">
                      <span className={`inline-block min-w-[28px] px-1 py-0.5 rounded text-[10px] font-mono ${
                        supply.content[s] > 0 ? "bg-blue-50 text-blue-700" : "text-gray-300"
                      }`}>
                        {supply.content[s] || 0}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 sticky left-0 bg-white z-10 text-[10px] font-semibold text-gray-500 italic">🤝 SMEs</td>
                  {skills.map((s) => (
                    <td key={`sme-${s}`} className="px-0.5 py-1 text-center">
                      <span className={`inline-block min-w-[28px] px-1 py-0.5 rounded text-[10px] font-mono ${
                        supply.smes[s] > 0 ? "bg-violet-50 text-violet-700" : "text-gray-300"
                      }`}>
                        {supply.smes[s] || 0}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 pr-2 sticky left-0 bg-white z-10 text-[10px] font-semibold text-gray-500 italic">⚡ Demand</td>
                  {skills.map((s) => (
                    <td key={`demand-${s}`} className="px-0.5 py-1 text-center">
                      <span className="inline-block min-w-[28px] px-1 py-0.5 rounded text-[10px] font-mono bg-rose-50 text-rose-700">
                        {demandTotal[s] || 0}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p className="text-[10px] text-gray-400 italic mt-3">
              Cell intensity = number of people in that department working on that skill cluster (via primary goal, path step, or recent session). Click a cell to see who.
              Bottom rows show supply-side: indexed content items + SMEs offering that topic.
            </p>
          </section>

          {/* Active cell drill-down */}
          {activeCell && activeUsers.length > 0 && (
            <section className="bg-white border border-rose-200 rounded-2xl p-4 shadow-sm">
              <p className="text-[10px] text-rose-700 font-semibold tracking-wider mb-2">
                🔍 {activeCell.dept} · {activeCell.skill} — {activeUsers.length} {activeUsers.length === 1 ? "person" : "people"}
                <button onClick={() => setActiveCell(null)} className="ml-3 text-[10px] text-gray-500 hover:text-gray-700 font-normal">✕ Close</button>
              </p>
              <div className="space-y-1.5">
                {activeUsers.map((u) => (
                  <div key={u.user_id} className="flex items-center gap-2 px-2.5 py-1.5 rounded border border-gray-100">
                    <div className="w-6 h-6 rounded-full bg-rose-50 text-rose-700 flex items-center justify-center text-[9px] font-bold shrink-0">
                      {(u.name || "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <p className="text-[11px] font-semibold text-text-primary flex-1 truncate">{u.name}</p>
                    <span className="text-[9px] text-gray-500">{u.role}</span>
                    <span className="text-[9px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5">{u.status}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Gaps */}
          {gaps.length > 0 && (
            <section className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm">
              <p className="text-[10px] text-amber-700 font-semibold tracking-wider mb-2">⚠ DEMAND-SUPPLY GAPS · {gaps.length}</p>
              <p className="text-[11px] text-gray-600 leading-relaxed mb-3">
                Skills people are actively learning but the org has insufficient content or SMEs to support. Address these first — every L&D dollar here delivers max ROI.
              </p>
              <div className="space-y-2">
                {gaps.map((g, i) => {
                  const tone = g.severity === "high"
                    ? "border-red-300 bg-red-50/40"
                    : "border-amber-300 bg-amber-50/40";
                  const sevTone = g.severity === "high" ? "bg-red-600 text-white" : "bg-amber-500 text-white";
                  return (
                    <div key={i} className={`px-3 py-2.5 rounded-lg border ${tone}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[8px] uppercase tracking-wider rounded px-1.5 py-0.5 font-bold ${sevTone}`}>{g.severity}</span>
                        <span className="text-[12px] font-bold text-text-primary">{g.skill}</span>
                        <span className="ml-auto text-[10px] font-mono text-gray-500">demand {g.demand} · supply {g.supply}</span>
                      </div>
                      <p className="text-[10px] text-gray-600">
                        Active in: {g.departments.join(", ") || "—"}.
                        {g.supply === 0
                          ? " 🚨 No content indexed, no SMEs registered. Top priority for content acquisition."
                          : ` Supply ratio is low (${g.supply} content vs ${g.demand} demand). Consider expanding content library or recruiting more SMEs.`}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </>
  );
}


function ReportsTab({ actorId }) {
  const [list, setList] = useState(null);
  const [active, setActive] = useState("skill_coverage");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [periodDays, setPeriodDays] = useState(30);
  const [department, setDepartment] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    agent.adminReportsList(actorId).then(setList);
  }, []);

  async function runReport() {
    setLoading(true);
    const filters = {};
    if (active === "engagement") filters.period_days = Number(periodDays);
    if (department.trim()) filters.department = department.trim();
    const result = await agent.adminRunReport(actorId, active, filters);
    setReport(result);
    setLoading(false);
  }

  useEffect(() => { runReport(); /* eslint-disable-next-line */ }, [active]);

  async function exportCsv() {
    setExporting(true);
    const filters = {};
    if (active === "engagement") filters.period_days = Number(periodDays);
    if (department.trim()) filters.department = department.trim();
    const result = await agent.adminExportReportCsv(actorId, active, filters);
    if (result?.csv) {
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = result.filename || `aasan-report-${active}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  }

  const reports = list?.reports || [];
  const summary = report?.summary || {};
  const columns = report?.columns || [];
  const rows = report?.rows || [];

  return (
    <>
      {/* Report selector */}
      <section className="grid grid-cols-3 gap-3">
        {reports.map((r) => (
          <button
            key={r.id}
            onClick={() => setActive(r.id)}
            className={`text-left p-4 rounded-2xl border-2 transition-all ${
              active === r.id ? "border-rose-500 bg-rose-50/40" : "border-gray-200 bg-white hover:border-rose-300"
            }`}
          >
            <p className="text-[12px] font-bold text-text-primary mb-1">{r.title}</p>
            <p className="text-[11px] text-gray-600 leading-relaxed">{r.description}</p>
          </button>
        ))}
      </section>

      {/* Filters + Export */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          placeholder="Filter by department (exact match)"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-rose-400 min-w-[220px]"
        />
        {active === "engagement" && (
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-rose-400 bg-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        )}
        <button
          onClick={runReport}
          disabled={loading}
          className={`text-[11px] font-semibold rounded-md px-2.5 py-2 transition-colors ${
            loading ? "bg-rose-100 text-rose-400 cursor-wait" : "bg-rose-600 text-white hover:bg-rose-700"
          }`}
        >
          {loading ? "Running…" : "↻ Run report"}
        </button>
        <button
          onClick={exportCsv}
          disabled={exporting || rows.length === 0}
          className={`text-[11px] font-semibold rounded-md px-2.5 py-2 transition-colors ${
            exporting ? "bg-rose-100 text-rose-400 cursor-wait"
              : rows.length === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
          }`}
        >
          {exporting ? "Exporting…" : "↓ Export CSV"}
        </button>
      </section>

      {/* Summary strip */}
      {report && summary && (
        <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-2">SUMMARY</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {Object.entries(summary).filter(([k]) => typeof summary[k] !== "object").map(([k, v]) => (
              <div key={k}>
                <p className="text-[9px] text-gray-400 font-semibold tracking-wider uppercase">{k.replace(/_/g, " ")}</p>
                <p className="text-[16px] font-bold text-text-primary leading-none">{String(v)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Report table */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {loading && <p className="px-4 py-6 text-[12px] text-gray-400">Running report…</p>}
        {!loading && rows.length === 0 && (
          <p className="px-4 py-6 text-[12px] text-gray-400 italic">No rows in this report. Try changing filters or running a different report.</p>
        )}
        {!loading && rows.length > 0 && (
          <>
            <div className="grid gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
              {columns.map((col) => (
                <p key={col.key} className="text-[9px] font-semibold text-gray-400 tracking-wider uppercase truncate">{col.label}</p>
              ))}
            </div>
            <div className="max-h-[28rem] overflow-y-auto">
              {rows.map((row, i) => (
                <div key={i} className="grid gap-3 px-4 py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/40" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
                  {columns.map((col) => (
                    <p key={col.key} className="text-[11px] text-gray-700 truncate">{String(row[col.key] ?? "—")}</p>
                  ))}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {report && (
        <p className="text-[9px] text-gray-400 italic">
          Generated at {report.generated_at} · {rows.length} row{rows.length !== 1 ? "s" : ""}
          {report.period_days ? ` · last ${report.period_days} days` : ""}
        </p>
      )}
    </>
  );
}


function AuditLogTab({ actorId }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const [exporting, setExporting] = useState(false);

  async function load() {
    setLoading(true);
    const result = await agent.adminAuditLog(actorId, {
      search: search || undefined,
      filter_action: actionFilter || undefined,
      filter_actor: actorFilter || undefined,
      limit: 200,
    });
    setData(result);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  // Debounce filters lightly
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [search, actionFilter, actorFilter]);

  async function exportCsv() {
    setExporting(true);
    const result = await agent.adminAuditLogExportCsv(actorId, {
      search: search || undefined,
      filter_action: actionFilter || undefined,
      filter_actor: actorFilter || undefined,
    });
    if (result?.csv) {
      const blob = new Blob([result.csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename || "aasan-audit-log.csv";
      a.click();
      URL.revokeObjectURL(url);
    }
    setExporting(false);
  }

  const entries = data?.entries || [];
  const byAction = data?.by_action || {};

  return (
    <>
      {/* Stats strip */}
      <section className="grid grid-cols-4 gap-3">
        <Stat label="Total events" value={data?.total ?? "—"} />
        <Stat label="Distinct actions" value={Object.keys(byAction).length || "—"} />
        <Stat label="Distinct actors" value={Object.keys(data?.by_actor || {}).length || "—"} />
        <Stat label="Filtered shown" value={data?.filtered_count ?? "—"} />
      </section>

      {/* Filters */}
      <section className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Full-text search (action, target, actor, details)…"
            className="col-span-3 px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-rose-400"
          />
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="action (e.g. admin:* or goal:create)"
            className="px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-rose-400 font-mono"
          />
          <input
            type="text"
            value={actorFilter}
            onChange={(e) => setActorFilter(e.target.value)}
            placeholder="actor user_id contains…"
            className="px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-rose-400 font-mono"
          />
          <button
            onClick={exportCsv}
            disabled={exporting || entries.length === 0}
            className={`text-[11px] font-semibold rounded-md transition-colors ${
              exporting ? "bg-rose-100 text-rose-400 cursor-wait"
                : entries.length === 0 ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-rose-600 text-white hover:bg-rose-700"
            }`}
          >
            {exporting ? "Exporting…" : "↓ Export CSV"}
          </button>
        </div>

        {/* Top actions strip */}
        {Object.keys(byAction).length > 0 && (
          <div className="flex flex-wrap gap-1 pt-2 border-t border-gray-100">
            <span className="text-[9px] text-gray-400 font-semibold tracking-wider mt-1 mr-1">TOP ACTIONS</span>
            {Object.entries(byAction).slice(0, 8).map(([act, n]) => (
              <button
                key={act}
                onClick={() => setActionFilter(actionFilter === act ? "" : act)}
                className={`text-[10px] font-mono rounded-full px-2 py-0.5 transition-colors ${
                  actionFilter === act ? "bg-rose-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {act} <span className="opacity-60">{n}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Log table */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
          <p className="col-span-2 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">When</p>
          <p className="col-span-2 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">Actor</p>
          <p className="col-span-2 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">Action</p>
          <p className="col-span-3 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">Target</p>
          <p className="col-span-3 text-[9px] font-semibold text-gray-400 tracking-wider uppercase">Details</p>
        </div>
        {loading && <p className="px-4 py-6 text-[12px] text-gray-400">Loading audit log…</p>}
        {!loading && entries.length === 0 && (
          <p className="px-4 py-6 text-[12px] text-gray-400 italic">
            {data?.total === 0 ? "No actions audited yet. Try changing a user's role or running a CSV import to see the log populate." : "No entries match the filter."}
          </p>
        )}
        {!loading && entries.map((e) => (
          <div key={e.audit_id} className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-gray-50 last:border-0 items-center hover:bg-gray-50/40">
            <p className="col-span-2 text-[10px] text-gray-500 font-mono">{fmtAuditTime(e.timestamp)}</p>
            <div className="col-span-2 min-w-0">
              <p className="text-[11px] font-semibold text-text-primary truncate">{e.actor_user_id}</p>
              {e.actor_role && <p className="text-[9px] text-gray-400">{e.actor_role}</p>}
            </div>
            <p className="col-span-2 text-[10px] font-mono text-rose-700 truncate">{e.action}</p>
            <p className="col-span-3 text-[10px] font-mono text-gray-700 truncate">{e.target || <span className="text-gray-400 italic">—</span>}</p>
            <p className="col-span-3 text-[10px] text-gray-600 truncate font-mono">
              {e.details && Object.keys(e.details).length > 0
                ? Object.entries(e.details).map(([k, v]) => `${k}=${JSON.stringify(v)}`).join(" ")
                : <span className="text-gray-400 italic">—</span>}
            </p>
          </div>
        ))}
      </section>
    </>
  );
}

function fmtAuditTime(iso) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) {
      return `Today ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`;
    }
    return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch { return iso; }
}

function ResultStat({ label, value, tone = "neutral" }) {
  const colors = {
    emerald: { border: "border-emerald-200", bg: "bg-emerald-50", text: "text-emerald-700" },
    blue:    { border: "border-blue-200",    bg: "bg-blue-50",    text: "text-blue-700" },
    amber:   { border: "border-amber-200",   bg: "bg-amber-50",   text: "text-amber-700" },
    red:     { border: "border-red-200",     bg: "bg-red-50",     text: "text-red-700" },
    neutral: { border: "border-gray-200",    bg: "bg-gray-50",    text: "text-gray-700" },
  }[tone];
  return (
    <div className={`border ${colors.border} ${colors.bg} rounded-lg p-2`}>
      <p className={`text-[9px] font-semibold tracking-wider ${colors.text}`}>{label.toUpperCase()}</p>
      <p className={`text-[18px] font-bold ${colors.text} leading-none mt-0.5`}>{value}</p>
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
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch { return iso; }
}
