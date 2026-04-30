import { useEffect, useState } from "react";
import agent from "../../services/agentService";

/**
 * Library canvas — Phase 2.
 *
 * The L&D / CLO buyer's primary surface. Three jobs:
 *   1. Search the corpus across every connected source (real search box, not chat)
 *   2. See coverage at a glance — total + by source + top skills + by difficulty
 *   3. Add more sources / re-run indexing
 */

export default function LibraryCanvas() {
  const [coverage, setCoverage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [reindexing, setReindexing] = useState(false);

  async function loadCoverage() {
    setLoading(true);
    const data = await agent.getContentCoverage();
    setCoverage(data);
    setLoading(false);
  }

  useEffect(() => { loadCoverage(); }, []);

  async function handleSearch(e) {
    e?.preventDefault?.();
    if (!query.trim()) return;
    setSearching(true);
    const data = await agent.semanticSearch(query.trim(), { topK: 10 });
    setResults(data);
    setSearching(false);
  }

  async function handleReindex() {
    setReindexing(true);
    await agent.runDriveIndex({ limit: 25 });
    await loadCoverage();
    setReindexing(false);
  }

  const total = coverage?.total ?? 0;
  const sources = Object.entries(coverage?.by_source || {});
  const skills = Object.entries(coverage?.by_skill || {});
  const diffs = coverage?.by_difficulty || {};
  const types = coverage?.by_content_type || {};
  const recent = coverage?.recent || [];
  const matches = results?.matches || [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <header>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">📚 Library</h1>
          <span className="text-[11px] text-gray-400">Universal learning content layer</span>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
          One search across every learning source you already pay for. Goal-anchored content from real sources — Drive, Confluence, Slack, Coursera, LinkedIn Learning, your internal LMS.
        </p>
      </header>

      {/* Stats strip */}
      <section className="grid grid-cols-4 gap-3">
        <Stat label="Indexed items" value={total} loading={loading} />
        <Stat label="Sources" value={sources.length} loading={loading} />
        <Stat label="Skill clusters" value={skills.length} loading={loading} />
        <Stat label="Vectors" value={coverage?.vector_total ?? 0} loading={loading}
              hint={coverage?.modes?.vector_index === "live" ? "Pinecone live" : "stub mode"} />
      </section>

      {/* Search */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-2">SEMANTIC SEARCH</p>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find content by topic, concept, or goal — e.g. 'mTLS basics'"
            className="flex-1 px-3.5 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-navy/40"
          />
          <button
            type="submit"
            disabled={searching || !query.trim()}
            className={`px-4 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${
              searching || !query.trim()
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-navy text-white hover:bg-navy/90"
            }`}
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>

        {results && (
          <div className="mt-4">
            <p className="text-[10px] text-gray-400 font-mono mb-2">
              {matches.length} match{matches.length !== 1 ? "es" : ""} for {JSON.stringify(results.query)}
              {results.modes && ` · ${results.modes.embeddings}/${results.modes.vector_index}`}
            </p>
            <div className="space-y-2">
              {matches.length === 0 && (
                <p className="text-[12px] text-gray-400 italic">No matches. Try a broader query, or ⚙ Run an indexing pass to add more content.</p>
              )}
              {matches.map((m, i) => (
                <ResultRow key={m.id || i} match={m} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Coverage — top skills */}
      {skills.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">COVERAGE — TOP SKILL CLUSTERS</p>
          <div className="flex flex-wrap gap-2">
            {skills.map(([skill, count]) => (
              <button
                key={skill}
                onClick={() => { setQuery(skill); setTimeout(handleSearch, 0); }}
                className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full px-3 py-1 transition-colors"
                title={`${count} item${count > 1 ? "s" : ""} — click to search`}
              >
                {skill} <span className="opacity-70">{count}</span>
              </button>
            ))}
          </div>

          {/* Difficulty + type strip */}
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div>
              <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1">BY DIFFICULTY</p>
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(diffs).map(([d, n]) => (
                  <span key={d} className="text-[10px] bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 capitalize">{d} <span className="opacity-60">{n}</span></span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1">BY TYPE</p>
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(types).map(([t, n]) => (
                  <span key={t} className="text-[10px] bg-gray-100 text-gray-700 rounded-full px-2 py-0.5 capitalize">{t} <span className="opacity-60">{n}</span></span>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sources panel */}
      <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider">SOURCES — INDEXED CONTENT BY ORIGIN</p>
          <button
            onClick={handleReindex}
            disabled={reindexing}
            className={`text-[11px] font-semibold rounded-md px-2.5 py-1 transition-colors ${
              reindexing
                ? "bg-gray-100 text-gray-400 cursor-wait"
                : "bg-navy text-white hover:bg-navy/90"
            }`}
          >
            {reindexing ? "Re-indexing…" : "⚙ Re-run Drive index"}
          </button>
        </div>
        <div className="space-y-2">
          {sources.length === 0 && !loading && (
            <p className="text-[12px] text-gray-400 italic">No content indexed yet. Click "Re-run Drive index" to seed the demo corpus, or connect a source.</p>
          )}
          {sources.map(([src, count]) => (
            <div key={src} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center text-[10px] font-bold text-blue-700 shrink-0">
                {(src[0] || "?").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-text-primary capitalize truncate">{src.replace("-", " ")}</p>
                <p className="text-[10px] text-gray-400">{count} item{count > 1 ? "s" : ""} indexed</p>
              </div>
              <span className="text-[9px] text-green-600 font-semibold tracking-wider">CONNECTED</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 italic mt-3">
          Confluence, Slack, Coursera, LinkedIn Learning, internal LMS connectors ship in Phase D — same DWD pattern as Drive.
        </p>
      </section>

      {/* Recently indexed */}
      {recent.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">RECENTLY INDEXED · {recent.length}</p>
          <div className="space-y-2">
            {recent.map((c) => (
              <ResultRow
                key={c.content_id}
                match={{ id: c.content_id, score: null, metadata: c }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, hint, loading }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
      <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-0.5">{label.toUpperCase()}</p>
      <p className="text-[22px] font-bold text-text-primary leading-none">
        {loading ? <span className="text-gray-300">—</span> : value}
      </p>
      {hint && <p className="text-[9px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
}

function ResultRow({ match }) {
  const m = match.metadata || {};
  const skills = m.skills || [];
  return (
    <a
      href={m.source_url || "#"}
      target={m.source_url ? "_blank" : undefined}
      rel="noreferrer"
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg border border-gray-100 hover:border-navy/30 hover:bg-navy/[0.02] transition-all group"
    >
      <div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-50 to-white border border-gray-100 flex items-center justify-center text-[10px] text-blue-600 shrink-0 mt-0.5">
        {m.content_type === "video" ? "▶" : m.content_type === "tutorial" ? "🛠" : m.content_type === "exercise" ? "✏" : "📄"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-text-primary leading-tight group-hover:text-navy">{m.title || "(untitled)"}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {m.source && <span className="text-[9px] text-gray-500 capitalize">{m.source.replace("-", " ")}</span>}
          {m.duration_minutes != null && <span className="text-[9px] text-gray-400">· {m.duration_minutes} min</span>}
          {m.difficulty && <span className="text-[9px] bg-gray-100 text-gray-600 rounded-full px-1.5 py-0.5 capitalize">{m.difficulty}</span>}
          {skills.slice(0, 3).map((s, i) => (
            <span key={i} className="text-[9px] bg-blue-50 text-blue-700 rounded-full px-1.5 py-0.5">{s}</span>
          ))}
          {skills.length > 3 && <span className="text-[9px] text-gray-400">+{skills.length - 3}</span>}
        </div>
      </div>
      {match.score != null && (
        <div className="text-right shrink-0">
          <p className="text-[10px] font-mono text-navy">{Math.round((match.score || 0) * 100)}</p>
          <p className="text-[8px] text-gray-400 uppercase">match</p>
        </div>
      )}
    </a>
  );
}
