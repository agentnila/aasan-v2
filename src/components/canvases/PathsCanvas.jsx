import { useEffect, useMemo, useRef, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import agent from "../../services/agentService";

/**
 * Paths canvas — Phase 2.
 *
 * The learner's primary surface for goals + their live learning paths.
 * Three jobs the canvas does that the chat card couldn't:
 *   1. Show the FULL ordered step list per goal (currently invisible in product)
 *   2. Inline step actions — mark done, skip, reorder
 *   3. Surface upcoming calendar blocks tied to this goal
 *
 * Data sources: /goal/list (goals + path summary), /path/get (full step
 * list per goal), /calendar/blocks (upcoming Schedule_Blocks).
 */

const STATUS_STYLES = {
  pending:   { bg: "bg-gray-100",     text: "text-gray-600",   dot: "bg-gray-300" },
  active:    { bg: "bg-blue-50",      text: "text-blue-700",   dot: "bg-blue-500"  },
  done:      { bg: "bg-emerald-50",   text: "text-emerald-700",dot: "bg-emerald-500" },
  known:     { bg: "bg-emerald-50",   text: "text-emerald-700",dot: "bg-emerald-300" },
  skipped:   { bg: "bg-gray-100",     text: "text-gray-500",   dot: "bg-gray-400"  },
  stale:     { bg: "bg-amber-50",     text: "text-amber-700",  dot: "bg-amber-500" },
};
const STEP_TYPE_LABEL = {
  content: "📄", refresher: "🔄", gap_closure: "🩹", assignment: "👤", review: "✅",
};

export default function PathsCanvas() {
  const { user } = useUser();
  const userId = user?.id || "demo-user";
  const [searchParams, setSearchParams] = useSearchParams();

  const [goals, setGoals] = useState([]);
  const [activeGoalId, setActiveGoalId] = useState(null);
  const [path, setPath] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pathLoading, setPathLoading] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [stepBusy, setStepBusy] = useState(null);
  const [reorderingStep, setReorderingStep] = useState(null);
  const [expandedStep, setExpandedStep] = useState(null);
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  // Wow-moment polish (Block 2)
  const [agentStatus, setAgentStatus] = useState(null);  // { claude: { live, mode }, perplexity_computer: { ... } }
  const [recomputeBanner, setRecomputeBanner] = useState(null);  // last diff result, dismissible
  const [changedStepIds, setChangedStepIds] = useState(() => new Set());  // step ids to flash
  const flashTimerRef = useRef(null);
  const bannerTimerRef = useRef(null);

  // Honor ?action=create-goal deep-link (from CommandBar / direct URL)
  useEffect(() => {
    if (searchParams.get("action") === "create-goal") {
      setAddGoalOpen(true);
      // Clear the param so back-nav doesn't re-open
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function loadGoals() {
    setLoading(true);
    const result = await agent.listGoals(userId);
    const list = result?.goals || [];
    setGoals(list);
    if (!activeGoalId && list.length > 0) {
      setActiveGoalId(list[0].id);
    } else if (activeGoalId && !list.find(g => g.id === activeGoalId)) {
      setActiveGoalId(list[0]?.id || null);
    }
    setLoading(false);
  }

  async function loadPath(goalId) {
    if (!goalId) return;
    setPathLoading(true);
    const result = await agent.getPath(userId, goalId);
    setPath(result);
    setPathLoading(false);
  }

  async function loadBlocks() {
    const result = await agent.listScheduleBlocks(userId);
    setBlocks(result?.blocks || []);
  }

  useEffect(() => { loadGoals(); loadBlocks(); }, []);
  useEffect(() => { if (activeGoalId) loadPath(activeGoalId); }, [activeGoalId]);

  // Fetch live/stub mode of Claude + Perplexity once per page load
  useEffect(() => {
    let cancelled = false;
    agent.getServerAgentStatus({ refresh: true }).then((s) => {
      if (!cancelled) setAgentStatus(s);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Cleanup any pending flash/banner timers on unmount
  useEffect(() => {
    return () => {
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, []);

  const activeGoal = useMemo(
    () => goals.find((g) => g.id === activeGoalId) || null,
    [goals, activeGoalId],
  );

  const pathSteps = path?.path?.steps || [];
  const pathHistory = path?.path?.recompute_history || [];

  const goalBlocks = useMemo(
    () => blocks.filter((b) => {
      if (!b.path_step_id) return false;
      return pathSteps.some((s) => s.id === b.path_step_id);
    }),
    [blocks, pathSteps],
  );

  async function handleMarkDone(step) {
    if (stepBusy) return;
    setStepBusy(step.id);
    await agent.markStepDone(userId, activeGoalId, step.id, { mastery: 0.7 });
    await loadPath(activeGoalId);
    await loadGoals();
    setStepBusy(null);
  }
  async function handleSkip(step) {
    if (stepBusy) return;
    const reason = window.prompt(`Skip "${step.title}"? Why?`, "Already familiar");
    if (reason == null) return;
    setStepBusy(step.id);
    await agent.skipStep(userId, activeGoalId, step.id, reason);
    await loadPath(activeGoalId);
    setStepBusy(null);
  }
  async function handleReorder(step, newOrder) {
    if (newOrder == null || isNaN(newOrder)) return;
    setStepBusy(step.id);
    await agent.reorderStep(userId, activeGoalId, step.id, Number(newOrder));
    await loadPath(activeGoalId);
    setStepBusy(null);
    setReorderingStep(null);
  }
  async function handleRecompute() {
    if (recomputing) return;
    setRecomputing(true);
    const result = await agent.recomputePath(userId, activeGoalId, "session_complete");

    // Capture the diff so the UI can surface what just happened
    if (result?.diff) {
      const added = Array.isArray(result.diff.added) ? result.diff.added : [];
      const modified = Array.isArray(result.diff.modified) ? result.diff.modified : [];
      const reordered = Array.isArray(result.diff.reordered) ? result.diff.reordered : [];
      const newIds = new Set([
        ...added.map((s) => s?.id).filter(Boolean),
        ...modified.map((s) => s?.id).filter(Boolean),
        ...reordered.map((s) => s?.id).filter(Boolean),
      ]);
      setChangedStepIds(newIds);
      setRecomputeBanner({
        summary: result.diff.summary || "Path adjusted.",
        added: added.map((s) => s?.title).filter(Boolean),
        modified: modified.map((s) => s?.id).filter(Boolean),
        mode: result.mode,
        changePct: result.change_pct,
        requiresConfirmation: result.requires_confirmation,
        at: Date.now(),
      });

      // Reset any prior timers — most-recent recompute wins
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
      // Brief flash on changed steps
      flashTimerRef.current = setTimeout(() => setChangedStepIds(new Set()), 6000);
      // Banner dismisses on its own after a longer beat
      bannerTimerRef.current = setTimeout(() => setRecomputeBanner(null), 14000);
    }

    await loadPath(activeGoalId);
    await loadGoals();
    setRecomputing(false);
  }
  function handleStartAddGoal() {
    setAddGoalOpen(true);
  }

  async function handleCreateGoal(profile) {
    const result = await agent.createGoal(userId, profile);
    if (result?.error) return { error: result.error };
    await loadGoals();
    if (result?.goal?.id) setActiveGoalId(result.goal.id);
    setAddGoalOpen(false);
    return { ok: true, goal: result?.goal };
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <header>
        <div className="flex items-baseline gap-3 mb-1">
          <h1 className="text-[24px] font-bold text-text-primary tracking-tight">🎯 Paths</h1>
          <span className="text-[11px] text-gray-400">Goal in. Live path out. Auto-adjusts.</span>
        </div>
        <p className="text-[13px] text-gray-500 leading-relaxed max-w-2xl">
          Multi-goal management with the live persistent learning path engine. Sessions, content, currency events, and assignments auto-adjust the path. Manual edits are sacred — the engine never overrides them.
        </p>
      </header>

      {/* Goal selector strip */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider">YOUR GOALS · {goals.length}</p>
          <button
            onClick={handleStartAddGoal}
            className="text-[11px] font-semibold bg-white border border-green-300 text-green-700 hover:bg-green-50 rounded-md px-2.5 py-1 transition-colors"
          >
            ✨ Add a goal
          </button>
        </div>
        {loading ? (
          <p className="text-[12px] text-gray-400">Loading…</p>
        ) : goals.length === 0 ? (
          <p className="text-[12px] text-gray-400 italic">No goals yet. Click "✨ Add a goal" to start.</p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {goals.map((g) => {
              const active = g.id === activeGoalId;
              const priority = g.priority || "primary";
              const badgeColor = priority === "primary" ? "bg-navy text-gold" : priority === "assigned" ? "bg-blue-600 text-white" : "bg-purple-100 text-purple-700";
              return (
                <button
                  key={g.id}
                  onClick={() => setActiveGoalId(g.id)}
                  className={`shrink-0 text-left px-3 py-2 rounded-xl border transition-all min-w-[180px] ${
                    active ? "border-green-500 bg-green-50/60 shadow-sm" : "border-gray-200 hover:border-green-300 bg-white"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`text-[8px] font-bold tracking-wider px-1 py-0.5 rounded ${badgeColor}`}>{priority.toUpperCase()}</span>
                    <span className="text-[12px] font-semibold text-text-primary truncate">{g.name}</span>
                  </div>
                  <div className="h-1 bg-gray-100 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-green-500" style={{ width: `${g.path_summary?.progress_pct || 0}%` }} />
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-500 truncate">{g.path_summary?.completed_steps || 0}/{g.path_summary?.total_steps || 0} steps</p>
                    <p className="text-[10px] font-mono text-green-700">{g.path_summary?.progress_pct || 0}%</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Active goal — header + steps */}
      {activeGoal && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-[18px] font-bold text-text-primary leading-tight">{activeGoal.name}</h2>
              {activeGoal.objective && (
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">📌 {activeGoal.objective}</p>
              )}
              {activeGoal.success_criteria && (
                <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">✅ {activeGoal.success_criteria}</p>
              )}
              <p className="text-[11px] text-gray-400 mt-1">
                {activeGoal.timeline}
                {activeGoal.days_left ? ` · ${activeGoal.days_left} days left` : ""}
                {activeGoal.delta ? ` · ${activeGoal.delta}` : ""}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[26px] font-bold text-navy leading-none">{activeGoal.readiness}</p>
              <p className="text-[8px] text-gray-400 uppercase tracking-wider">readiness</p>
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider">PATH · {pathSteps.length} STEPS</p>
            <div className="flex items-center gap-2">
              <ModeBadge agentStatus={agentStatus} />
              <button
                onClick={handleRecompute}
                disabled={recomputing}
                className={`text-[11px] font-semibold rounded-md px-2.5 py-1 transition-colors ${
                  recomputing ? "bg-gray-100 text-gray-400 cursor-wait" : "bg-white border border-green-300 text-green-700 hover:bg-green-50"
                }`}
              >
                {recomputing ? "Recomputing…" : "⚡ Trigger recompute"}
              </button>
            </div>
          </div>

          {recomputeBanner && (
            <RecomputeBanner banner={recomputeBanner} onDismiss={() => setRecomputeBanner(null)} />
          )}

          {pathLoading ? (
            <p className="text-[12px] text-gray-400">Loading path…</p>
          ) : pathSteps.length === 0 ? (
            <p className="text-[12px] text-gray-400 italic">Empty path. Run a session, add content, or trigger a recompute to populate.</p>
          ) : (
            <div className="space-y-1.5">
              {pathSteps.map((step) => {
                const style = STATUS_STYLES[step.status] || STATUS_STYLES.pending;
                const isOpen = expandedStep === step.id;
                const isLearnerEdit = step.inserted_by === "learner";
                const isManagerInsert = step.inserted_by === "manager";
                const isEngineInsert = step.inserted_by === "engine";
                const isRecentlyChanged = changedStepIds.has(step.id);
                const wrapperBorder = isRecentlyChanged
                  ? "border-emerald-400 bg-emerald-50/50 ring-2 ring-emerald-200/70 path-step-flash"
                  : isOpen
                    ? "border-green-300 bg-green-50/30"
                    : "border-gray-100";
                return (
                  <div key={step.id} className={`rounded-lg border ${wrapperBorder} transition-all`}>
                    <button
                      onClick={() => setExpandedStep(isOpen ? null : step.id)}
                      className="w-full text-left px-3 py-2.5 flex items-start gap-3"
                    >
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                      <div className="w-7 text-center shrink-0">
                        <p className="text-[10px] font-mono text-gray-400">{step.order}</p>
                        <p className="text-[14px]">{STEP_TYPE_LABEL[step.step_type] || "📄"}</p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[12px] font-semibold ${step.status === "skipped" ? "text-gray-400 line-through" : "text-text-primary"} truncate`}>
                          {step.title}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className={`text-[9px] rounded-full px-1.5 py-0.5 font-medium ${style.bg} ${style.text}`}>
                            {step.status}
                          </span>
                          {step.estimated_minutes && (
                            <span className="text-[9px] text-gray-400">{step.estimated_minutes}m</span>
                          )}
                          {step.mastery_at_completion != null && (
                            <span className="text-[9px] text-emerald-600">⭐ {(step.mastery_at_completion * 100).toFixed(0)}%</span>
                          )}
                          {isLearnerEdit && <span className="text-[9px] text-blue-600">✋ learner</span>}
                          {isManagerInsert && <span className="text-[9px] text-amber-600">👤 manager</span>}
                          {isRecentlyChanged && isEngineInsert && (
                            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 rounded-full px-1.5 py-0.5 animate-pulse">✨ engine just adjusted</span>
                          )}
                        </div>
                      </div>
                      <span className={`text-[9px] text-gray-400 shrink-0 transition-transform mt-1 ${isOpen ? "rotate-90" : ""}`}>▶</span>
                    </button>

                    {isOpen && (
                      <div className="ml-9 pl-2 mr-3 mb-3 mt-1 border-l-2 border-green-200 space-y-2">
                        {step.inserted_reason && (
                          <p className="text-[11px] text-gray-600 italic">{step.inserted_reason}</p>
                        )}
                        {step.completed_at && (
                          <p className="text-[10px] text-gray-400">
                            Completed {step.completed_at}
                            {step.actual_minutes && ` · ${step.actual_minutes}m actual`}
                          </p>
                        )}
                        {step.skipped_reason && (
                          <p className="text-[10px] text-gray-500 italic">Skipped: {step.skipped_reason}</p>
                        )}
                        {/* Inline actions */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {(step.status === "active" || step.status === "pending") && (
                            <>
                              <button
                                onClick={() => handleMarkDone(step)}
                                disabled={stepBusy === step.id}
                                className="text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-100 disabled:text-emerald-400 rounded-md px-2.5 py-1 transition-colors"
                              >
                                ✓ Mark done
                              </button>
                              <button
                                onClick={() => handleSkip(step)}
                                disabled={stepBusy === step.id}
                                className="text-[11px] font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-md px-2.5 py-1 transition-colors"
                              >
                                Skip
                              </button>
                            </>
                          )}
                          {reorderingStep === step.id ? (
                            <ReorderInput initial={step.order} onSubmit={(n) => handleReorder(step, n)} onCancel={() => setReorderingStep(null)} />
                          ) : (
                            <button
                              onClick={() => setReorderingStep(step.id)}
                              disabled={stepBusy === step.id}
                              className="text-[11px] font-semibold border border-gray-300 text-gray-600 hover:bg-gray-50 rounded-md px-2.5 py-1 transition-colors"
                            >
                              ↕ Reorder
                            </button>
                          )}
                          <span className="ml-auto text-[9px] text-gray-400 italic">step #{step.id}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Recompute history */}
      {pathHistory.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">PATH ADJUSTMENT HISTORY · {pathHistory.length}</p>
          <div className="space-y-2">
            {pathHistory.map((adj, i) => (
              <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-lg border border-gray-100">
                <span className="text-[10px] font-mono text-gray-400 shrink-0 mt-0.5">{adj.date}</span>
                {adj.trigger && (
                  <span className="text-[8px] uppercase tracking-wider text-gray-500 bg-gray-100 rounded px-1.5 py-0.5 shrink-0 mt-0.5">{adj.trigger}</span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-text-primary leading-snug">{adj.reason}</p>
                  {adj.added && adj.added.length > 0 && (
                    <p className="text-[10px] text-gray-500 mt-0.5">+ inserted: {adj.added.join(", ")}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming calendar blocks for this goal */}
      {goalBlocks.length > 0 && (
        <section className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-3">UPCOMING LEARNING BLOCKS · {goalBlocks.length}</p>
          <div className="space-y-2">
            {goalBlocks.map((b) => (
              <div key={b.block_id} className="flex items-center gap-3 px-3 py-2 rounded-lg border border-gray-100">
                <div className="w-9 h-9 rounded-md bg-gradient-to-br from-blue-50 to-white border border-gray-100 flex items-center justify-center text-[14px] shrink-0">📅</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-text-primary truncate">{b.step_title}</p>
                  <p className="text-[10px] text-gray-400">{fmtBlockTime(b.start_at, b.end_at)} · {b.duration_minutes} min</p>
                </div>
                {b.calendar_event_url && (
                  <a href={b.calendar_event_url} target="_blank" rel="noreferrer" className="text-[11px] text-navy hover:underline">Open ↗</a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {addGoalOpen && (
        <AddGoalModal
          onClose={() => setAddGoalOpen(false)}
          onCreate={handleCreateGoal}
        />
      )}
    </div>
  );
}

// Inline keyframe for the recompute step-flash. Plain CSS (no animation
// library dependency). Mounted once via a single <style> tag.
const PATH_FLASH_STYLE = `
@keyframes path-step-flash-keyframes {
  0%   { box-shadow: 0 0 0 0   rgba(16,185,129,0.55); }
  50%  { box-shadow: 0 0 0 8px rgba(16,185,129,0);    }
  100% { box-shadow: 0 0 0 0   rgba(16,185,129,0);    }
}
.path-step-flash { animation: path-step-flash-keyframes 1.6s ease-in-out 2; }

@keyframes recompute-banner-slide {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.recompute-banner-enter { animation: recompute-banner-slide 280ms ease-out; }
`;

// Inject the stylesheet once at module load (idempotent — won't duplicate)
if (typeof document !== "undefined" && !document.getElementById("paths-canvas-anim-style")) {
  const el = document.createElement("style");
  el.id = "paths-canvas-anim-style";
  el.textContent = PATH_FLASH_STYLE;
  document.head.appendChild(el);
}

/**
 * Live/stub indicator for the path engine's reasoning brain.
 * Reads `claude` and `perplexity_computer` from /agent/status.
 * Renders nothing while the status is still loading — avoid flicker.
 */
function ModeBadge({ agentStatus }) {
  if (!agentStatus) return null;
  const claudeLive = agentStatus?.claude?.live === true;
  const dotColor = claudeLive ? "bg-emerald-500" : "bg-gray-400";
  const ringColor = claudeLive ? "ring-emerald-200" : "ring-gray-200";
  const label = claudeLive ? "Engine · live" : "Engine · stub";
  const titleAttr = claudeLive
    ? "Path Engine reasoning runs against the live Claude API."
    : "Path Engine is in stub mode — set ANTHROPIC_API_KEY in Render to flip live.";
  return (
    <span
      title={titleAttr}
      className="inline-flex items-center gap-1.5 text-[10px] font-medium text-gray-600 bg-white border border-gray-200 rounded-full px-2 py-0.5"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor} ${claudeLive ? "animate-pulse" : ""} ring-2 ring-offset-0 ${ringColor}`} />
      {label}
    </span>
  );
}

/**
 * "What just happened" banner — surfaces the diff returned by /path/recompute.
 * Auto-dismisses on a timer (set in handleRecompute), but the user can also
 * close it explicitly. Carries the live/stub mode of the recompute call so
 * the wow moment is unambiguous.
 */
function RecomputeBanner({ banner, onDismiss }) {
  if (!banner) return null;
  const isLive = banner.mode === "live";
  return (
    <div
      className={`recompute-banner-enter mb-3 rounded-xl border p-3 flex items-start gap-3 ${
        banner.requiresConfirmation
          ? "bg-amber-50 border-amber-300"
          : "bg-gradient-to-r from-emerald-50 to-emerald-50/30 border-emerald-300"
      }`}
    >
      <span className="text-[20px] leading-none">{banner.requiresConfirmation ? "⚠️" : "✨"}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {banner.requiresConfirmation ? "Engine wants confirmation" : "Path adjusted"}
          </p>
          <span className={`text-[9px] font-semibold rounded-full px-1.5 py-0.5 ${
            isLive ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
          }`}>
            {isLive ? "Claude · live" : "stub"}
          </span>
          {typeof banner.changePct === "number" && (
            <span className="text-[9px] text-gray-500">
              {Math.round(banner.changePct * 100)}% of pending changed
            </span>
          )}
        </div>
        <p className="text-[12px] text-text-primary leading-snug">{banner.summary}</p>
        {banner.added.length > 0 && (
          <p className="text-[11px] text-emerald-700 mt-1">
            + inserted: {banner.added.join(" · ")}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-700 text-[14px] shrink-0 -mt-0.5"
        title="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

function AddGoalModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [timeline, setTimeline] = useState("");
  const [successCriteria, setSuccessCriteria] = useState("");
  const [priority, setPriority] = useState("primary");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Esc closes
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await onCreate({
      name: name.trim(),
      objective: objective.trim(),
      timeline: timeline.trim(),
      success_criteria: successCriteria.trim(),
      priority,
    });
    setSubmitting(false);
    if (result?.error) setError(result.error);
    // onClose handled by parent on success
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[10vh]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[560px] max-w-[92vw] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-green-700">🎯 NEW GOAL</p>
            <p className="text-[14px] font-bold text-text-primary mt-0.5">What are you working toward?</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-[18px]" title="Close (Esc)">✕</button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          <Field label="Goal name" required>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Become a Cloud Architect"
              className="w-full px-3 py-2 rounded-md border border-gray-200 text-[13px] focus:outline-none focus:border-green-400"
              required
            />
          </Field>

          <Field label="Why this goal? (objective)" hint="One sentence on the outcome you want.">
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Lead our team's cloud migration and get promoted to Staff Engineer."
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-gray-200 text-[13px] focus:outline-none focus:border-green-400 resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Timeline" hint="When do you want this done?">
              <input
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
                placeholder="Q4 2026"
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-[13px] focus:outline-none focus:border-green-400"
              />
            </Field>
            <Field label="Priority">
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-[13px] focus:outline-none focus:border-green-400 bg-white"
              >
                <option value="primary">Primary — main focus</option>
                <option value="assigned">Assigned — required of me</option>
                <option value="exploration">Exploration — curious about it</option>
              </select>
            </Field>
          </div>

          <Field label="What does done look like? (success criteria)" hint="The Path Engine uses this to know when you're ready.">
            <textarea
              value={successCriteria}
              onChange={(e) => setSuccessCriteria(e.target.value)}
              placeholder="Lead a multi-region production migration. Get promoted to Staff Engineer."
              rows={2}
              className="w-full px-3 py-2 rounded-md border border-gray-200 text-[13px] focus:outline-none focus:border-green-400 resize-none"
            />
          </Field>

          {error && <p className="text-[11px] text-red-600">{error}</p>}

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
            <p className="text-[10px] text-gray-400">The Path Engine builds your live path next — you can edit it any time.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="text-[12px] text-gray-600 hover:text-gray-900 px-3 py-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || submitting}
                className={`text-[12px] font-semibold rounded-md px-4 py-2 transition-colors ${
                  !name.trim() || submitting
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {submitting ? "Creating…" : "Create goal →"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, hint, required, children }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-gray-700 block mb-1">
        {label}{required && <span className="text-rose-500"> *</span>}
      </span>
      {children}
      {hint && <span className="text-[10px] text-gray-400 mt-1 block">{hint}</span>}
    </label>
  );
}

function ReorderInput({ initial, onSubmit, onCancel }) {
  const [val, setVal] = useState(String(initial));
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        className="w-16 px-2 py-1 rounded-md border border-gray-300 text-[11px] focus:outline-none focus:border-green-500"
        autoFocus
      />
      <button onClick={() => onSubmit(val)} className="text-[11px] font-semibold bg-green-600 text-white hover:bg-green-700 rounded-md px-2 py-1">Save</button>
      <button onClick={onCancel} className="text-[11px] text-gray-500 hover:text-gray-700">Cancel</button>
    </div>
  );
}

function fmtBlockTime(startIso, endIso) {
  try {
    const s = new Date(startIso);
    const e = new Date(endIso);
    const today = new Date();
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const dayLabel = s.toDateString() === today.toDateString() ? "Today"
      : s.toDateString() === tomorrow.toDateString() ? "Tomorrow"
      : s.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const fmt = (d) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return `${dayLabel} · ${fmt(s)} – ${fmt(e)}`;
  } catch { return startIso; }
}
