import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import agent from "../../services/agentService";

/**
 * Resume canvas — Phase 2.
 *
 * Two surfaces stitched into one view:
 *   1. Living service record (journal) — list view with search + category filter
 *   2. Tailor workflow — paste a JD, get a tailored resume drawn from the journal
 *
 * Backend is unchanged from previous ships (/resume/add, /resume/journal,
 * /resume/tailor). This canvas just gives them a real surface that doesn't
 * require chat-card round-trips.
 */

const CATEGORY_LABELS = {
  project:         { label: "Project",         dot: "bg-emerald-500" },
  customer:        { label: "Customer",        dot: "bg-blue-500" },
  tech_adoption:   { label: "Tech adoption",   dot: "bg-violet-500" },
  mentoring:       { label: "Mentoring",       dot: "bg-amber-500" },
  presentation:    { label: "Presentation",    dot: "bg-pink-500" },
  crisis_response: { label: "Crisis response", dot: "bg-red-500" },
  documentation:   { label: "Documentation",   dot: "bg-teal-500" },
  leadership:      { label: "Leadership",      dot: "bg-orange-500" },
  solution:        { label: "Solution",        dot: "bg-cyan-500" },
};

function categoryMeta(c) {
  return CATEGORY_LABELS[c] || { label: c || "other", dot: "bg-gray-400" };
}

export default function ResumeCanvas() {
  const { user } = useUser();
  const userId = user?.id || "demo-user";

  const [tab, setTab] = useState("record"); // 'record' | 'tailor'
  const [journal, setJournal] = useState(null);
  const [loading, setLoading] = useState(true);

  // Add-entry form state
  const [addingText, setAddingText] = useState("");
  const [adding, setAdding] = useState(false);
  const [companyField, setCompanyField] = useState("");
  const [projectField, setProjectField] = useState("");
  const [shareEmails, setShareEmails] = useState("");
  const [endorseEmails, setEndorseEmails] = useState("");

  // Search + filter
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  // Tailor state
  const [jobInput, setJobInput] = useState("");
  const [tailoring, setTailoring] = useState(false);
  const [tailorResult, setTailorResult] = useState(null);

  async function loadJournal() {
    setLoading(true);
    const result = await agent.listJournal(userId);
    setJournal(result);
    setLoading(false);
  }

  useEffect(() => { loadJournal(); }, []);

  async function handleAdd() {
    const text = addingText.trim();
    if (!text) return;
    setAdding(true);
    const peers_to_share_with = shareEmails.split(",").map(e => e.trim()).filter(Boolean);
    const peers_to_endorse   = endorseEmails.split(",").map(e => e.trim()).filter(Boolean);
    await agent.addJournalEntry(userId, text, {
      company: companyField.trim(),
      project: projectField.trim(),
      peers_to_share_with,
      peers_to_endorse,
    });
    setAddingText("");
    setCompanyField("");
    setProjectField("");
    setShareEmails("");
    setEndorseEmails("");
    await loadJournal();
    setAdding(false);
  }

  async function handleTailor() {
    const text = jobInput.trim();
    if (!text) return;
    setTailoring(true);
    setTailorResult(null);
    const isUrl = /^https?:\/\//i.test(text);
    const result = await agent.tailorResume(userId, isUrl ? text : "", isUrl ? "" : text);
    setTailorResult(result);
    setTailoring(false);
  }

  const entries = journal?.entries || [];
  const byCategory = journal?.by_category || {};
  const categoriesPresent = useMemo(
    () => Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a]),
    [byCategory],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (activeCat && e.category !== activeCat) return false;
      if (!q) return true;
      const blob = [
        e.title, e.description,
        ...(e.outcomes || []), ...(e.technologies || []),
        ...(e.transferable_skills || []), ...(e.stakeholders || []),
      ].filter(Boolean).join(" ").toLowerCase();
      return blob.includes(q);
    });
  }, [entries, query, activeCat]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <header>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">📋 Resume</h1>
          <span className="text-[11px] text-gray-400">Your living service record</span>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
          Tell Peraasan what you did. When a job posting lands, get a tailored resume drawn from your real entries — not a generic doc rewritten in panic.
        </p>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab("record")}
          className={`text-[12px] font-semibold px-4 py-2.5 transition-all border-b-2 ${
            tab === "record" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📋 Service Record <span className="opacity-60">{journal?.entry_count || 0}</span>
        </button>
        <button
          onClick={() => setTab("tailor")}
          className={`text-[12px] font-semibold px-4 py-2.5 transition-all border-b-2 ${
            tab === "tailor" ? "border-emerald-600 text-emerald-700" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          📝 Tailor a Resume
        </button>
      </div>

      {tab === "record" && (
        <>
          {/* Add entry */}
          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-2">✍ LOG A WORK ENTRY</p>
            <textarea
              value={addingText}
              onChange={(e) => setAddingText(e.target.value)}
              disabled={adding}
              rows={3}
              placeholder='Tell Peraasan what you did. e.g. "Just shipped the new caching layer. Reduced p95 latency from 200ms to 80ms. Presented results to the platform team."'
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-emerald-400 resize-none mb-2"
            />

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1">🏢 COMPANY</p>
                <input
                  type="text"
                  value={companyField}
                  onChange={(e) => setCompanyField(e.target.value)}
                  disabled={adding}
                  placeholder="e.g. TechCorp"
                  className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[11px] focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1">📁 PROJECT</p>
                <input
                  type="text"
                  value={projectField}
                  onChange={(e) => setProjectField(e.target.value)}
                  disabled={adding}
                  placeholder="e.g. Platform Reliability"
                  className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[11px] focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1">📤 SHARE WITH PEERS <span className="font-normal text-gray-400">(optional)</span></p>
                <input
                  type="text"
                  value={shareEmails}
                  onChange={(e) => setShareEmails(e.target.value)}
                  disabled={adding}
                  placeholder="comma-separated emails"
                  className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[11px] focus:outline-none focus:border-emerald-400"
                />
              </div>
              <div>
                <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1">⭐ REQUEST ENDORSEMENT <span className="font-normal text-gray-400">(optional)</span></p>
                <input
                  type="text"
                  value={endorseEmails}
                  onChange={(e) => setEndorseEmails(e.target.value)}
                  disabled={adding}
                  placeholder="comma-separated emails"
                  className="w-full px-2.5 py-1.5 rounded-md border border-gray-200 text-[11px] focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-gray-400 italic">Claude extracts title, category, outcomes, technologies, transferable skills. Endorsements + shares appear in your peers' feeds.</p>
              <button
                onClick={handleAdd}
                disabled={adding || !addingText.trim()}
                className={`text-[12px] font-semibold rounded-md px-3 py-1.5 transition-colors shrink-0 ml-3 ${
                  adding ? "bg-emerald-100 text-emerald-400 cursor-wait"
                    : !addingText.trim() ? "bg-emerald-200 text-emerald-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {adding ? "Adding…" : "✍ Add to record"}
              </button>
            </div>
          </section>

          {/* Search + filter + list */}
          <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider">YOUR RECORD · {entries.length} ENTRIES</p>
              <p className="text-[9px] text-gray-400 italic">Searchable forever · feeds the tailor</p>
            </div>
            <div className="space-y-2 mb-3">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title, outcomes, technologies, transferable skills…"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-emerald-400"
              />
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setActiveCat(null)}
                  className={`text-[10px] font-medium rounded-full px-2 py-0.5 transition-colors ${!activeCat ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  All <span className="opacity-70">{entries.length}</span>
                </button>
                {categoriesPresent.map((cat) => {
                  const meta = categoryMeta(cat);
                  const active = activeCat === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCat(active ? null : cat)}
                      className={`text-[10px] font-medium rounded-full px-2 py-0.5 transition-colors flex items-center gap-1 ${active ? "bg-emerald-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                      {meta.label} <span className="opacity-70">{byCategory[cat]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-1.5">
              {loading && <p className="text-[12px] text-gray-400">Loading record…</p>}
              {!loading && filtered.length === 0 && entries.length === 0 && (
                <p className="text-[12px] text-gray-400 italic px-2 py-4 text-center">No entries yet. Log your first one above — every entry compounds the tailor's quality.</p>
              )}
              {!loading && filtered.length === 0 && entries.length > 0 && (
                <p className="text-[12px] text-gray-400 italic px-2 py-4 text-center">No entries match your search/filter.</p>
              )}
              {filtered.map((e, i) => {
                const meta = categoryMeta(e.category);
                const isOpen = expandedId === e.entry_id;
                return (
                  <div key={e.entry_id || i} className={`rounded-lg border ${isOpen ? "border-emerald-300 bg-emerald-50/30" : "border-gray-100"}`}>
                    <button
                      onClick={() => setExpandedId(isOpen ? null : e.entry_id)}
                      className="w-full text-left px-3 py-2.5 flex items-start gap-3"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${meta.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] font-mono text-gray-400 shrink-0">{e.date}</span>
                          <span className="text-[12px] font-semibold text-text-primary truncate">{e.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[9px] text-gray-500">{meta.label}</span>
                          {(() => {
                            const approved = (e.endorsements || []).filter(en => en.status === "approved").length;
                            const pending = (e.endorsements || []).filter(en => en.status === "pending").length;
                            return (
                              <>
                                {approved > 0 && <span className="text-[9px] bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 font-medium">⭐ {approved}</span>}
                                {pending > 0 && <span className="text-[9px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-medium">⏳ {pending}</span>}
                                {(e.shared_with || []).length > 0 && <span className="text-[9px] bg-blue-100 text-blue-700 rounded-full px-1.5 py-0.5 font-medium">📤 {(e.shared_with || []).length}</span>}
                              </>
                            );
                          })()}
                          {(e.outcomes || []).slice(0, 1).map((o, j) => (
                            <span key={j} className="text-[10px] text-gray-500 truncate">· {o}</span>
                          ))}
                        </div>
                      </div>
                      <span className={`text-[9px] text-gray-400 shrink-0 mt-1 transition-transform ${isOpen ? "rotate-90" : ""}`}>▶</span>
                    </button>
                    {isOpen && (
                      <div className="ml-3 pl-3 mr-3 mb-3 mt-1 border-l-2 border-emerald-200 space-y-2">
                        {(e.company || e.project) && (
                          <p className="text-[10px] text-gray-500">
                            {e.company && <span className="font-medium">🏢 {e.company}</span>}
                            {e.company && e.project && <span> · </span>}
                            {e.project && <span>📁 {e.project}</span>}
                          </p>
                        )}
                        {e.description && <p className="text-[11px] text-gray-700 leading-relaxed">{e.description}</p>}
                        {(e.outcomes || []).length > 0 && (
                          <div>
                            <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-0.5">OUTCOMES</p>
                            <ul className="space-y-0.5">
                              {e.outcomes.map((o, j) => <li key={j} className="text-[11px] text-gray-700 leading-relaxed">· {o}</li>)}
                            </ul>
                          </div>
                        )}
                        {(e.technologies || []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {e.technologies.map((t, j) => (
                              <span key={j} className="text-[9px] bg-violet-50 text-violet-700 rounded-full px-2 py-0.5">{t}</span>
                            ))}
                          </div>
                        )}
                        {(e.transferable_skills || []).length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {e.transferable_skills.map((s, j) => (
                              <span key={j} className="text-[9px] bg-emerald-50 text-emerald-700 rounded-full px-2 py-0.5">{s}</span>
                            ))}
                          </div>
                        )}
                        {(e.endorsements || []).length > 0 && (
                          <div className="border-t border-emerald-100 pt-2">
                            <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-1">⭐ ENDORSEMENTS · {e.endorsements.length}</p>
                            <div className="space-y-1">
                              {e.endorsements.map((en, j) => {
                                const approved = en.status === "approved";
                                return (
                                  <div key={j} className="flex items-start gap-2 text-[10px]">
                                    <span className={`shrink-0 mt-0.5 ${approved ? "text-emerald-600" : "text-gray-400"}`}>
                                      {approved ? "✓" : "⏳"}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                      <p className={approved ? "text-text-primary font-medium" : "text-gray-500"}>
                                        {en.endorser_name || en.endorser_email}
                                        {en.endorser_role && <span className="text-gray-400 font-normal"> · {en.endorser_role}</span>}
                                      </p>
                                      {en.comment && <p className="text-gray-600 italic mt-0.5">"{en.comment}"</p>}
                                      {!approved && <p className="text-[9px] text-amber-600 mt-0.5">pending response</p>}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                        {(e.shared_with || []).length > 0 && (
                          <p className="text-[9px] text-gray-500">📤 Shared with: {e.shared_with.join(", ")}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {tab === "tailor" && (
        <section className="grid grid-cols-2 gap-4">
          {/* Left — JD input + record pool */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div>
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-2">📝 PASTE A JOB POSTING</p>
              <textarea
                value={jobInput}
                onChange={(e) => setJobInput(e.target.value)}
                disabled={tailoring}
                rows={6}
                placeholder="Paste the job URL or the full JD text…"
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[12px] focus:outline-none focus:border-emerald-400 resize-none"
              />
              <button
                onClick={handleTailor}
                disabled={tailoring || !jobInput.trim()}
                className={`mt-2 w-full text-[12px] font-semibold rounded-md py-2 transition-colors ${
                  tailoring ? "bg-emerald-100 text-emerald-400 cursor-wait"
                    : !jobInput.trim() ? "bg-emerald-200 text-emerald-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {tailoring ? "Tailoring…" : "📝 Tailor my resume"}
              </button>
            </div>
            <div className="border-t border-gray-100 pt-3">
              <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1">DRAWING FROM</p>
              <p className="text-[11px] text-gray-600">{entries.length} entries across {categoriesPresent.length} categories.</p>
              <p className="text-[10px] text-gray-400 italic mt-1">More entries = better tailor. The closer your record matches the JD's keywords, the higher the match score.</p>
            </div>
          </div>

          {/* Right — tailored output */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            {!tailorResult && !tailoring && (
              <p className="text-[12px] text-gray-400 italic px-2 py-8 text-center">Paste a job and click "Tailor my resume" — Claude maps your record to the JD and surfaces the right projects + skills.</p>
            )}
            {tailoring && (
              <p className="text-[12px] text-gray-500 px-2 py-8 text-center">Reading the JD + matching your record…</p>
            )}
            {tailorResult && tailorResult.error && (
              <p className="text-[12px] text-red-600">Error: {tailorResult.error}</p>
            )}
            {tailorResult && !tailorResult.error && (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-[14px] font-bold text-text-primary">{tailorResult.job_title || "Tailored resume"}</p>
                    <p className="text-[11px] text-gray-500">{tailorResult.job_company || ""}</p>
                  </div>
                  {tailorResult.match_score != null && (
                    <div className="text-right">
                      <p className="text-[20px] font-bold text-emerald-700 leading-none">{Math.round(tailorResult.match_score * 100)}%</p>
                      <p className="text-[8px] text-gray-400 uppercase tracking-wider">match</p>
                    </div>
                  )}
                </div>
                {tailorResult.tailored_summary && (
                  <div className="bg-emerald-50/40 border border-emerald-100 rounded-md px-3 py-2.5">
                    <p className="text-[9px] font-semibold text-emerald-700 tracking-wider mb-1">SUMMARY</p>
                    <p className="text-[11px] text-gray-700 leading-relaxed">{tailorResult.tailored_summary}</p>
                  </div>
                )}
                {(tailorResult.highlighted_projects || []).length > 0 && (
                  <div>
                    <p className="text-[9px] font-semibold text-gray-400 tracking-wider mb-1.5">HIGHLIGHTED PROJECTS · {tailorResult.highlighted_projects.length}</p>
                    <div className="space-y-2">
                      {tailorResult.highlighted_projects.map((p, i) => {
                        const ends = p.endorsements || [];
                        return (
                          <div key={i} className="px-3 py-2 rounded-lg border border-gray-100">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="text-[11px] font-semibold text-text-primary">{p.title}</span>
                              <span className="text-[9px] font-mono text-emerald-700 shrink-0">{Math.round((p.match_score || 0) * 100)}%</span>
                            </div>
                            {(p.company || p.project) && (
                              <p className="text-[9px] text-gray-500 mt-0.5">
                                {p.company && <span>🏢 {p.company}</span>}
                                {p.company && p.project && <span> · </span>}
                                {p.project && <span>📁 {p.project}</span>}
                              </p>
                            )}
                            {p.match_reason && <p className="text-[10px] text-gray-500 mt-0.5 italic">{p.match_reason}</p>}
                            {(p.outcomes || []).slice(0, 2).map((o, j) => (
                              <p key={j} className="text-[10px] text-gray-700 mt-0.5">· {o}</p>
                            ))}
                            {ends.length > 0 && (
                              <div className="mt-2 pt-1.5 border-t border-emerald-100 bg-emerald-50/30 rounded-md -mx-3 -mb-2 px-3 pb-2">
                                <p className="text-[8px] font-bold text-emerald-700 tracking-wider mt-1.5 mb-1">⭐ ENDORSED BY {ends.length} {ends.length === 1 ? "PEER" : "PEERS"}</p>
                                {ends.map((en, j) => (
                                  <div key={j} className="text-[10px] mt-0.5">
                                    <span className="font-semibold text-text-primary">{en.endorser_name}</span>
                                    {en.endorser_role && <span className="text-gray-500"> · {en.endorser_role}</span>}
                                    {en.comment && <p className="text-gray-600 italic leading-snug">"{en.comment}"</p>}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                {(tailorResult.gaps_vs_job || []).length > 0 && (
                  <div className="bg-amber-50/40 border border-amber-100 rounded-md px-3 py-2.5">
                    <p className="text-[9px] font-semibold text-amber-700 tracking-wider mb-1">GAPS VS JOB · {tailorResult.gaps_vs_job.length}</p>
                    <ul className="space-y-0.5">
                      {tailorResult.gaps_vs_job.map((g, i) => <li key={i} className="text-[10px] text-gray-700 leading-relaxed">· {g}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
