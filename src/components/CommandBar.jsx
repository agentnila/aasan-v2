import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

/**
 * CommandBar — Phase H · Canvas-first redesign.
 *
 * Bottom-center floating pill, mounts globally. ⌘K (or Ctrl-K) opens
 * a search modal: jump to any module, run common actions, ask Peraasan.
 *
 * Replaces the legacy left sidebar's role of "where do I go / what can
 * I do." The rail is for navigation between top-level modules; the
 * CommandBar is for everything more granular.
 */

const COMMANDS = [
  // Navigation
  { kind: "nav", icon: "🏠", label: "Go to Kudil",       hint: "Home dashboard",            to: "/" },
  { kind: "nav", icon: "📚", label: "Go to Library",     hint: "Search content + sources",  to: "/library" },
  { kind: "nav", icon: "🎯", label: "Go to Paths",       hint: "Goals + path engine",        to: "/paths" },
  { kind: "nav", icon: "🛡", label: "Go to Stay Ahead",  hint: "AI-resilience + market",     to: "/stay-ahead" },
  { kind: "nav", icon: "📋", label: "Go to Resume",      hint: "Service record",             to: "/resume" },
  { kind: "nav", icon: "🤝", label: "Go to Marketplace", hint: "SMEs + Gigs",                to: "/marketplace" },
  { kind: "nav", icon: "👥", label: "Go to Team",        hint: "Manager view",               to: "/team" },
  { kind: "nav", icon: "⚙", label: "Open Admin Console", hint: "People · reports · audit",  to: "/admin", adminOnly: true },

  // Actions
  { kind: "action", icon: "💬", label: "Ask Peraasan",         hint: "Open the agent chat",      action: "openChat" },
  { kind: "action", icon: "✍",  label: "Log a work entry",     hint: "Resume · Service Record",   to: "/resume" },
  { kind: "action", icon: "🛠", label: "Post a gig",           hint: "Marketplace · Gigs",        to: "/marketplace?tab=gigs&view=post" },
  { kind: "action", icon: "🎯", label: "Create a goal",        hint: "Paths",                     to: "/paths?action=create-goal" },
  { kind: "action", icon: "⚙", label: "Run Currency Watch",   hint: "Stay Ahead · scan tracked sources", to: "/stay-ahead?action=currency-scan" },
];

export default function CommandBar({ isAdmin, onOpenChat }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const navigate = useNavigate();

  // ⌘K / Ctrl-K hotkey
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(o => !o);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const visibleCommands = useMemo(() => {
    return COMMANDS.filter(c => !c.adminOnly || isAdmin);
  }, [isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return visibleCommands;
    return visibleCommands.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.hint.toLowerCase().includes(q)
    );
  }, [query, visibleCommands]);

  // Reset idx when query changes
  useEffect(() => { setActiveIdx(0); }, [query]);

  function runCommand(cmd) {
    setOpen(false);
    setQuery("");
    if (cmd.action === "openChat") {
      onOpenChat?.();
    } else if (cmd.to) {
      navigate(cmd.to);
    }
  }

  function onInputKey(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const cmd = filtered[activeIdx];
      if (cmd) runCommand(cmd);
    }
  }

  return (
    <>
      {/* The pill — always visible, bottom-center */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-2.5 flex items-center gap-3 w-[460px] max-w-[90vw] hover:bg-gray-800 transition-colors"
      >
        <span className="text-[14px]">✨</span>
        <span className="flex-1 text-left text-[12px] text-gray-400">
          Ask Peraasan · search · jump to anything
        </span>
        <kbd className="text-[9px] bg-white/10 border border-white/20 rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
      </button>

      {/* The modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-start justify-center pt-[14vh]"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-[640px] max-w-[90vw] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <span className="text-[18px]">✨</span>
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Type a command, search, or ask Peraasan…"
                className="flex-1 outline-none text-[14px] placeholder-gray-400"
              />
              <kbd className="text-[9px] bg-gray-100 text-gray-500 border border-gray-200 rounded px-1.5 py-0.5 font-mono">esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[420px] overflow-y-auto p-2">
              {filtered.length === 0 ? (
                <p className="text-[12px] text-gray-400 italic px-3 py-4 text-center">No matches. Try a different keyword.</p>
              ) : (
                <>
                  {/* Group by kind */}
                  {["nav", "action"].map(kind => {
                    const items = filtered.filter(c => c.kind === kind);
                    if (items.length === 0) return null;
                    const label = kind === "nav" ? "GO TO" : "ACTIONS";
                    return (
                      <div key={kind} className="mb-1">
                        <p className="text-[9px] font-semibold tracking-wider text-gray-400 px-3 py-1.5">{label}</p>
                        {items.map((cmd, i) => {
                          const idx = filtered.indexOf(cmd);
                          const isActive = idx === activeIdx;
                          return (
                            <button
                              key={cmd.label}
                              onClick={() => runCommand(cmd)}
                              onMouseEnter={() => setActiveIdx(idx)}
                              className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                                isActive ? "bg-gray-900 text-white" : "hover:bg-gray-50 text-text-primary"
                              }`}
                            >
                              <span className="text-[16px] leading-none">{cmd.icon}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] font-semibold truncate">{cmd.label}</p>
                                <p className={`text-[10px] truncate ${isActive ? "text-gray-300" : "text-gray-500"}`}>{cmd.hint}</p>
                              </div>
                              {isActive && <kbd className={`text-[9px] rounded px-1.5 py-0.5 font-mono ${isActive ? "bg-white/15 text-gray-200" : ""}`}>↵</kbd>}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer hint */}
            <div className="border-t border-gray-100 px-4 py-2 flex items-center gap-3 text-[10px] text-gray-500">
              <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1 font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1 font-mono">↵</kbd> select</span>
              <span><kbd className="bg-gray-100 border border-gray-200 rounded px-1 font-mono">esc</kbd> close</span>
              <span className="ml-auto">{filtered.length} match{filtered.length === 1 ? "" : "es"}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
