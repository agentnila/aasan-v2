import { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import ChatPanel from "./ChatPanel";
import ContextPanel from "./ContextPanel";
import CommandBar from "./CommandBar";
import agent from "../services/agentService";

/**
 * ModuleCanvas — Phase H · Canvas-first redesign.
 *
 * Layout:
 *   [ModuleRail 48px] [full-bleed canvas] [slide-out context rail]
 *   [floating CommandBar — bottom center]
 *
 * No more left SourcesNav. No more always-visible right rail.
 * Chat moves into a slide-over triggered from the CommandBar
 * ("Ask Peraasan") OR a floating button on each module.
 */

export function ModuleLayout({
  module,
  contextData,
  setContextData,
  backendContext,
  contextLoading,
  children,
}) {
  const { user } = useUser();
  const [chatOpen, setChatOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    agent.getMe(user?.id || "demo-user").then((me) => {
      if (cancelled) return;
      setIsAdmin(!!me?.is_admin);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <>
      <main className="flex-1 flex flex-col bg-bg overflow-hidden relative">
        <div className="flex-1 overflow-y-auto">
          {module === "kudil" ? (
            children
          ) : (
            <div className="px-8 py-8 max-w-5xl">
              {children}
            </div>
          )}
        </div>

        {/* Slide-out context rail trigger — pinned right edge */}
        {!contextOpen && (
          <button
            onClick={() => setContextOpen(true)}
            className="absolute top-1/2 right-0 -translate-y-1/2 bg-white border border-gray-200 rounded-l-lg shadow-sm hover:shadow-md hover:bg-rose-50/40 transition-all py-3 pl-2 pr-1.5 group"
            title="Open context rail"
          >
            <span className="text-[10px] [writing-mode:vertical-rl] text-gray-500 group-hover:text-rose-700 font-semibold tracking-wider">CONTEXT ↗</span>
          </button>
        )}
      </main>

      {/* Slide-out context rail */}
      {contextOpen && (
        <div
          className="fixed inset-y-0 right-0 w-80 bg-white border-l border-gray-200 shadow-2xl z-30 flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-500">Context</p>
            <button
              onClick={() => setContextOpen(false)}
              className="text-gray-400 hover:text-gray-700 text-[14px]"
              title="Close"
            >
              ✕
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ContextPanel
              data={contextData}
              user={user}
              context={backendContext}
              contextLoading={contextLoading}
              embedded
            />
          </div>
        </div>
      )}

      {/* Chat slide-over — Ask Peraasan from CommandBar */}
      {chatOpen && (
        <div className="fixed inset-0 bg-black/30 z-40 flex justify-end" onClick={() => setChatOpen(false)}>
          <div
            className="w-[480px] max-w-full bg-white shadow-xl flex flex-col h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-[12px] font-semibold text-text-primary">Peraasan · agent layer</p>
              <button
                onClick={() => setChatOpen(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                title="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <ChatPanel
              onContextChange={setContextData}
              userName={user?.firstName || "there"}
              context={backendContext}
              userId={user?.id}
            />
          </div>
        </div>
      )}

      {/* Universal floating CommandBar */}
      <CommandBar isAdmin={isAdmin} onOpenChat={() => setChatOpen(true)} />
    </>
  );
}

/**
 * StubCanvas — kept for any module that hasn't been built out yet.
 * Phase H: most modules now have real canvases.
 */
export function StubCanvas({ icon, title, tagline, comingSoon, paneHint }) {
  return (
    <div className="px-12 py-12 max-w-3xl">
      <div className="text-[40px] mb-2">{icon}</div>
      <h1 className="text-[26px] font-bold text-text-primary tracking-tight mb-1">{title}</h1>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-5 max-w-xl">{tagline}</p>

      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
        <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1">COMING SOON</p>
        <p className="text-[12px] text-gray-700 leading-relaxed">{comingSoon}</p>
      </div>

      {paneHint && (
        <div className="bg-blue-50/40 border border-blue-100 rounded-xl px-4 py-3">
          <p className="text-[10px] text-blue-700 font-semibold tracking-wider mb-1">⌘K · USE THE COMMAND BAR</p>
          <p className="text-[12px] text-gray-700 leading-relaxed">{paneHint}</p>
        </div>
      )}
    </div>
  );
}
