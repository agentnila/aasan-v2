import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import SourcesNav from "./SourcesNav";
import ChatPanel from "./ChatPanel";
import ContextPanel from "./ContextPanel";

/**
 * ModuleCanvas — the surface inside each module.
 *
 * For Phase 1, every non-Kudil module gets a stub canvas: a card-shaped panel
 * explaining what's coming, with the actions hosted in the module pane on the
 * left (filtered SourcesNav) and chat available as a slide-over from the right.
 *
 * Phase 2 replaces these stubs with real dashboards:
 *   Library → search UI + sources list + coverage map
 *   Paths   → goal cards opening into full per-step path detail
 *   Resume  → journal as a list view + tailor as a focused workflow
 *   Stay Ahead → AI-resilience score full-bleed + components + scenarios
 *   Marketplace → SME list + bookings inbox + register flow as canvas surfaces
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

  // On Kudil, chat is the canvas (today's experience). Everywhere else, chat
  // is a slide-over from the right that overlays the canvas.
  const isKudil = module === "kudil";

  return (
    <>
      {/* Module pane — filtered SourcesNav showing only this module's sections */}
      <SourcesNav module={module} />

      {/* Canvas — chat for Kudil, stub for everything else (Phase 2 fills in) */}
      {isKudil ? (
        <ChatPanel
          onContextChange={setContextData}
          userName={user?.firstName || "there"}
          context={backendContext}
          userId={user?.id}
        />
      ) : (
        <main className="flex-1 flex flex-col bg-bg overflow-hidden relative">
          <div className="flex-1 overflow-y-auto px-8 py-8">
            <div className="max-w-3xl mx-auto">
              {children}
            </div>
          </div>

          {/* Chat slide-over trigger */}
          <button
            onClick={() => setChatOpen(true)}
            className="absolute bottom-5 right-5 bg-navy text-white text-[12px] font-semibold rounded-full px-4 py-2.5 shadow-md hover:bg-navy/90 transition-all flex items-center gap-2"
            title="Open Peraasan chat"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            Chat with Peraasan
          </button>

          {chatOpen && (
            <div className="absolute inset-0 bg-black/30 z-40 flex justify-end" onClick={() => setChatOpen(false)}>
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
        </main>
      )}

      {/* Context rail — preserved across all modules (Phase 5 will adapt per module) */}
      <ContextPanel
        data={contextData}
        user={user}
        context={backendContext}
        contextLoading={contextLoading}
      />
    </>
  );
}

/**
 * StubCanvas — placeholder content for non-Kudil modules in Phase 1.
 * Phase 2 replaces each with a real dashboard surface.
 */
export function StubCanvas({ icon, title, tagline, comingSoon, paneHint }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
      <div className="text-[40px] mb-2">{icon}</div>
      <h1 className="text-[22px] font-bold text-text-primary tracking-tight mb-1">{title}</h1>
      <p className="text-[13px] text-gray-500 leading-relaxed mb-5 max-w-xl">{tagline}</p>

      <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
        <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1">PHASE 2 PREVIEW</p>
        <p className="text-[12px] text-gray-700 leading-relaxed">{comingSoon}</p>
      </div>

      <div className="bg-blue-50/40 border border-blue-100 rounded-xl px-4 py-3">
        <p className="text-[10px] text-blue-700 font-semibold tracking-wider mb-1">⬅ ACTIONS LIVE IN THE LEFT PANE</p>
        <p className="text-[12px] text-gray-700 leading-relaxed">{paneHint}</p>
      </div>
    </div>
  );
}
