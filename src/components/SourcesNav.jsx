import { useEffect, useState } from "react";
import { useClerk, useUser } from "@clerk/clerk-react";
import { seedDemoContent } from "../data/seedContent";
import agent from "../services/agentService";

const sources = [
  { name: "Coursera", icon: "C", color: "bg-blue-500", connected: true, items: 2400 },
  { name: "LinkedIn Learning", icon: "in", color: "bg-blue-700", connected: true, items: 1800 },
  { name: "Confluence", icon: "C", color: "bg-blue-400", connected: true, items: 340 },
  { name: "Google Drive", icon: "G", color: "bg-green-500", connected: true, items: 125 },
  { name: "YouTube", icon: "▶", color: "bg-red-500", connected: true, items: 89 },
  { name: "Company LMS", icon: "L", color: "bg-navy", connected: true, items: 560 },
  { name: "Notion", icon: "N", color: "bg-gray-800", connected: false, items: 0 },
  { name: "SharePoint", icon: "S", color: "bg-teal-600", connected: false, items: 0 },
  { name: "Slack (Learning channels)", icon: "S", color: "bg-purple-500", connected: false, items: 0 },
];

export default function SourcesNav() {
  const [open, setOpen] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [seedDone, setSeedDone] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [careerScanning, setCareerScanning] = useState(false);
  const [careerResult, setCareerResult] = useState(null);
  const [stayAheadLoading, setStayAheadLoading] = useState(false);
  const [stayAheadStatus, setStayAheadStatus] = useState(null);
  const [simulating, setSimulating] = useState(false);
  const [simulateStatus, setSimulateStatus] = useState(null);
  const [predigestUrl, setPredigestUrl] = useState("");
  const [predigesting, setPredigesting] = useState(false);
  const [predigestResult, setPredigestResult] = useState(null);
  const [predigestOpen, setPredigestOpen] = useState(false);
  const [pathLoading, setPathLoading] = useState(false);
  const [pathLastAction, setPathLastAction] = useState(null);
  const [smeTopic, setSmeTopic] = useState("Service Mesh");
  const [smeLoading, setSmeLoading] = useState(false);
  const [smeLastAction, setSmeLastAction] = useState(null);
  // Agentic stack status — Bridge (sync) + Computer/Claude (async via /agent/status)
  const [bridgeLive, setBridgeLive] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [statusRefreshing, setStatusRefreshing] = useState(false);

  async function refreshAgentStatus() {
    setStatusRefreshing(true);
    setBridgeLive(agent.isBridgeConnected());
    try {
      const status = await agent.getServerAgentStatus({ refresh: true });
      setServerStatus(status);
    } catch (err) {
      setServerStatus({ error: err.message });
    }
    setStatusRefreshing(false);
  }

  // Initial poll + re-poll whenever the bridge announces itself
  useEffect(() => {
    refreshAgentStatus();
    const onBridgeReady = () => setBridgeLive(true);
    window.addEventListener("message", (e) => {
      if (e?.data?.source === "aasan-bridge" && e?.data?.type === "ready") {
        onBridgeReady();
      }
    });
    return () => {
      // listener cleanup intentionally simple — page reload clears it anyway
    };
  }, []);
  const connectedCount = sources.filter((s) => s.connected).length;
  const { openUserProfile, signOut } = useClerk();
  const { user } = useUser();
  const isDev = import.meta.env.DEV;

  async function handleCurrencyScan() {
    setScanning(true);
    setScanResult(null);
    try {
      const result = await agent.runCurrencyScan({
        userId: user?.id || "demo-user",
        maxConcepts: 5,
      });
      setScanResult(result);
      // Surface the digest in the chat as a Peraasan message
      const notifications = result.notifications || [];
      const summary = notifications.length === 0
        ? `Just ran a Currency Watch scan over ${result.concepts_scanned} of your tracked sources — everything is current. No action needed.`
        : `Just ran a Currency Watch scan. ${notifications.length} of ${result.concepts_scanned} sources have substantive changes you should know about.`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: {
          messageContent: summary,
          card: { type: "currency_digest", ...result },
        },
      }));
    } catch (err) {
      setScanResult({ error: err.message });
    }
    setScanning(false);
  }

  async function handleCareerScan() {
    setCareerScanning(true);
    setCareerResult(null);
    try {
      const result = await agent.runCareerScan({
        userId: user?.id || "demo-user",
        maxSignals: 7,
      });
      setCareerResult(result);
      // Surface the digest in the chat
      const summary = `Your weekly Career Compass digest — ${result.signals_count} signals for ${result.target_role}. Top picks below.`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: {
          messageContent: summary,
          card: { type: "career_digest", ...result },
        },
      }));
    } catch (err) {
      setCareerResult({ error: err.message });
    }
    setCareerScanning(false);
  }

  async function handleFindSMEs() {
    const topic = smeTopic.trim();
    if (!topic) return;
    setSmeLoading(true);
    setSmeLastAction("Matching SMEs…");
    try {
      const result = await agent.findSMEs(topic, user?.id || "demo-user", 5);
      const summary = `Found ${result.match_count} SMEs for "${topic}" — ${result.matches_by_type?.internal || 0} internal, ${result.matches_by_type?.external || 0} external.`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: {
          messageContent: summary,
          card: { type: "sme_match", ...result },
        },
      }));
      setSmeLastAction(`✓ ${result.match_count} matches in chat`);
    } catch (err) {
      setSmeLastAction(`Error: ${err.message}`);
    }
    setSmeLoading(false);
  }

  async function handleShowGoals() {
    setPathLoading(true);
    setPathLastAction("Loading goals…");
    try {
      const result = await agent.listGoals(user?.id || "demo-user");
      const summary = `You have ${result.goal_count} active goal${result.goal_count !== 1 ? "s" : ""}. Here's the dashboard.`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: {
          messageContent: summary,
          card: { type: "goals_dashboard", ...result },
        },
      }));
      setPathLastAction(`✓ Posted ${result.goal_count} goals to chat`);
    } catch (err) {
      setPathLastAction(`Error: ${err.message}`);
    }
    setPathLoading(false);
  }

  async function handleTriggerPathAdjust() {
    setPathLoading(true);
    setPathLastAction("Engine running…");
    try {
      const result = await agent.recomputePath(
        user?.id || "demo-user",
        "cloud-architect",
        "session_complete",
        { simulated: true },
      );
      const summary = `Just ran the Path Adjustment Engine on your Cloud Architect path (trigger: session_complete). ${result.diff?.summary || "No changes"}`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: {
          messageContent: summary,
          card: { type: "path_update", ...result },
        },
      }));
      setPathLastAction("✓ Path updated · diff in chat");
    } catch (err) {
      setPathLastAction(`Error: ${err.message}`);
    }
    setPathLoading(false);
  }

  async function handleStayAhead() {
    setStayAheadLoading(true);
    setStayAheadStatus("Scanning market + opportunities…");
    try {
      const result = await agent.runStayAhead(user?.id || "demo-user");
      const summary = `Stay Ahead — career mobility scan. ${result.best_fit_roles?.length || 0} best-fit roles, ${result.stretch_roles?.length || 0} stretch, ${result.pivot_options?.length || 0} pivots, ${result.hands_on_experiences?.length || 0} hands-on experiences.`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: {
          messageContent: summary,
          card: { type: "stay_ahead", ...result },
        },
      }));
      setStayAheadStatus("✓ Mobility digest in chat");
    } catch (err) {
      setStayAheadStatus(`Error: ${err.message}`);
    }
    setStayAheadLoading(false);
  }

  async function handleSimulateScenarios() {
    setSimulating(true);
    setSimulateStatus("Projecting outcomes…");
    try {
      const result = await agent.runScenarioSimulation(user?.id || "demo-user");
      const summary = `Career simulation across ${result.scenario_count} scenarios — projected outcomes at 6/12/18 months with probability ranges.`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: {
          messageContent: summary,
          card: { type: "scenario_simulation", ...result },
        },
      }));
      setSimulateStatus("✓ Simulation in chat");
    } catch (err) {
      setSimulateStatus(`Error: ${err.message}`);
    }
    setSimulating(false);
  }

  async function handlePredigest() {
    const url = predigestUrl.trim();
    if (!url) return;
    setPredigesting(true);
    setPredigestResult(null);
    try {
      const result = await agent.predigestDoc({
        url,
        learnerContext: { goal: "Become a Cloud Architect" },
      });
      setPredigestResult(result);
      if (!result.error) {
        const summary = `Read it for you. Here's the pre-digested version of "${result.title}" — TL;DR + ${result.key_concepts?.length || 0} key concepts, saves you about ${result.reading_time_saved_minutes || 15} minutes.`;
        window.dispatchEvent(new CustomEvent("aasan:digest", {
          detail: {
            messageContent: summary,
            card: { type: "predigest", ...result },
          },
        }));
        setPredigestUrl("");
      }
    } catch (err) {
      setPredigestResult({ error: err.message });
    }
    setPredigesting(false);
  }

  async function handleSeed() {
    setSeeding(true);
    try {
      await seedDemoContent();
      setSeedDone(true);
    } catch (err) {
      console.error('[Seed] Error:', err);
    }
    setSeeding(false);
  }

  // Collapsed state — just a thin strip with logo + toggle
  if (!open) {
    return (
      <nav className="w-[52px] min-w-[52px] bg-white border-r border-gray-100 flex flex-col items-center py-4 gap-2">
        <div className="w-9 h-9 rounded-full bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center shadow-sm border border-navy/20">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gold">
            <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
            <path d="M7 10c0 0 2.5-0.5 5 0.5v6c-2.5-1-5-0.5-5-0.5v-6z" fill="currentColor" opacity="0.3" />
            <path d="M17 10c0 0-2.5-0.5-5 0.5v6c2.5-1 5-0.5 5-0.5v-6z" fill="currentColor" opacity="0.3" />
          </svg>
        </div>
        <div className="flex-1" />
        <button
          onClick={() => setOpen(true)}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-navy transition-all relative"
          title="Open Sources"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 text-white text-[7px] font-bold rounded-full flex items-center justify-center">
            {connectedCount}
          </span>
        </button>
        <button onClick={() => openUserProfile()} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all" title="Account">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </button>
        <button onClick={() => signOut()} className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-all" title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </button>
      </nav>
    );
  }

  // Expanded state — full panel
  return (
    <nav className="w-[260px] min-w-[260px] bg-white border-r border-gray-100 flex flex-col overflow-y-auto no-scrollbar">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          {/* University crest logo */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center shadow-sm border border-navy/20 relative">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-gold">
              {/* Shield */}
              <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="1.2" />
              {/* Open book */}
              <path d="M7 10c0 0 2.5-0.5 5 0.5v6c-2.5-1-5-0.5-5-0.5v-6z" fill="currentColor" opacity="0.3" />
              <path d="M17 10c0 0-2.5-0.5-5 0.5v6c2.5-1 5-0.5 5-0.5v-6z" fill="currentColor" opacity="0.3" />
              <path d="M7 10c0 0 2.5-0.5 5 0.5M17 10c0 0-2.5-0.5-5 0.5" stroke="currentColor" strokeWidth="0.8" />
              {/* Star at top */}
              <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h2 className="font-serif text-[14px] font-bold text-navy tracking-tight">Aasan</h2>
            <p className="text-[8px] text-gray-400 tracking-[0.15em] uppercase">Est. 2026 · Personal University</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
          title="Close panel"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Agentic stack status — V3 two-vendor split */}
      <div className="px-4 py-3 border-b border-gray-50 bg-gradient-to-br from-purple-50/30 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[9px] text-purple-700 font-bold tracking-wider">⚙ AGENTIC STACK</p>
          <button
            onClick={refreshAgentStatus}
            disabled={statusRefreshing}
            title="Re-check status"
            className="text-[9px] text-gray-400 hover:text-purple-600 disabled:opacity-30"
          >
            {statusRefreshing ? "⟳ ..." : "⟳"}
          </button>
        </div>
        <StackPill label="Bridge · Chrome" mode={bridgeLive ? "live" : "not_connected"} hint={bridgeLive ? "Reads any web page in your browser" : "Extension not detected — install required"} />
        <StackPill label="Perplexity Computer" mode={serverStatus?.perplexity_computer?.mode} hint="Server-side: research, scrapes, predigest, enrollment" />
        <StackPill label="Claude (server-side)" mode={serverStatus?.claude?.mode} hint="Substance classifier · concept extractor" />
        {serverStatus?.error && (
          <p className="text-[9px] text-red-500 mt-1">Status check failed: {serverStatus.error}</p>
        )}
      </div>

      {/* Connected sources */}
      <div className="px-4 py-4 border-b border-gray-50">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2.5">
          CONNECTED SOURCES · {connectedCount}
        </p>
        <div className="flex flex-col gap-1.5">
          {sources.filter((s) => s.connected).map((source) => (
            <div
              key={source.name}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className={`w-7 h-7 rounded-md ${source.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                {source.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-text-primary truncate">{source.name}</p>
                <p className="text-[9px] text-gray-400">{source.items.toLocaleString()} items</p>
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Available to connect */}
      <div className="px-4 py-4">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-2.5">CONNECT MORE</p>
        <div className="flex flex-col gap-1.5">
          {sources.filter((s) => !s.connected).map((source) => (
            <div
              key={source.name}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg border border-dashed border-gray-200 hover:border-navy/30 transition-colors cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-[9px] font-bold shrink-0 group-hover:bg-navy/5 group-hover:text-navy transition-colors">
                {source.icon}
              </div>
              <p className="text-[11px] text-gray-500 group-hover:text-text-primary transition-colors flex-1 truncate">{source.name}</p>
              <span className="text-[9px] text-navy font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                +
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* V3: Currency Watch — full agentic loop demo */}
      <div className="px-4 py-3 border-t border-gray-50 bg-gradient-to-br from-purple-50/40 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <p className="text-[10px] text-purple-700 font-bold tracking-wider">⚙ CURRENCY WATCH</p>
        </div>
        <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
          Re-fetches your tracked sources via Perplexity Computer, classifies changes via Claude, surfaces what's substantive.
        </p>
        <button
          onClick={handleCurrencyScan}
          disabled={scanning}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
            scanning
              ? 'bg-purple-100 text-purple-400 cursor-wait'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {scanning ? '⚙ Scanning…' : '⚙ Run scan now'}
        </button>

        {scanResult && !scanResult.error && (
          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between text-[10px]">
              <span className="text-gray-500">{scanResult.concepts_scanned} concepts scanned</span>
              <span className="font-mono text-purple-700">
                {scanResult.notifications_count} notify
              </span>
            </div>
            {scanResult._client_stub_reason && (
              <p className="text-[9px] text-amber-600 italic">
                Stub mode: {scanResult._client_stub_reason}
              </p>
            )}
            <div className="flex flex-wrap gap-1 text-[9px]">
              <span className="px-1.5 py-0.5 rounded font-mono bg-white border border-gray-200">
                computer:{scanResult.modes?.computer || '?'}
              </span>
              <span className="px-1.5 py-0.5 rounded font-mono bg-white border border-gray-200">
                claude:{scanResult.modes?.classifier || '?'}
              </span>
            </div>
            <div className="space-y-1.5 mt-2">
              {scanResult.verdicts?.map((v, i) => (
                <div
                  key={i}
                  className={`px-2 py-1.5 rounded border text-[10px] ${
                    v.category === 'breaking'
                      ? 'bg-red-50/40 border-red-200'
                      : v.category === 'substantive'
                      ? 'bg-amber-50/40 border-amber-200'
                      : v.category === 'clarification'
                      ? 'bg-blue-50/30 border-blue-100'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-semibold text-text-primary truncate flex-1">{v.concept_name}</span>
                    <span
                      className={`px-1 py-0.5 rounded text-[8px] font-bold tracking-wider shrink-0 ${
                        v.category === 'breaking'
                          ? 'bg-red-600 text-white'
                          : v.category === 'substantive'
                          ? 'bg-amber-500 text-white'
                          : v.category === 'clarification'
                          ? 'bg-blue-200 text-blue-900'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {v.category}
                    </span>
                  </div>
                  <p className="text-gray-600 leading-snug line-clamp-2">{v.summary}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {scanResult?.error && (
          <p className="mt-2 text-[10px] text-red-600">Error: {scanResult.error}</p>
        )}
      </div>

      {/* V3: Career Compass — second Perplexity Computer use case */}
      <div className="px-4 py-3 border-t border-gray-50 bg-gradient-to-br from-purple-50/40 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <p className="text-[10px] text-purple-700 font-bold tracking-wider">⚙ CAREER COMPASS</p>
        </div>
        <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
          Scrapes job market + course launches + vendor certs via Perplexity Computer. Ranks signals by relevance to your role.
        </p>
        <button
          onClick={handleCareerScan}
          disabled={careerScanning}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
            careerScanning
              ? 'bg-purple-100 text-purple-400 cursor-wait'
              : 'bg-purple-600 text-white hover:bg-purple-700'
          }`}
        >
          {careerScanning ? '⚙ Scanning market…' : '⚙ Run market watch now'}
        </button>

        {careerResult && !careerResult.error && (
          <div className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between text-[10px]">
              <span className="text-gray-500 truncate">Role: {careerResult.target_role}</span>
              <span className="font-mono text-purple-700 shrink-0">
                {careerResult.signals_count} signals
              </span>
            </div>
            <div className="flex flex-wrap gap-1 text-[9px]">
              <span className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700">
                {careerResult.signals_by_type?.role_skill_shift || 0} role
              </span>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                {careerResult.signals_by_type?.new_course || 0} courses
              </span>
              <span className="px-1.5 py-0.5 rounded bg-green-50 border border-green-200 text-green-700">
                {careerResult.signals_by_type?.vendor_cert || 0} certs
              </span>
            </div>
            {careerResult._client_stub_reason && (
              <p className="text-[9px] text-amber-600 italic">
                Stub mode: {careerResult._client_stub_reason}
              </p>
            )}
            <div className="space-y-1.5 mt-2">
              {careerResult.signals?.map((s, i) => {
                const typeBadge = {
                  role_skill_shift: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'role' },
                  new_course: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'course' },
                  vendor_cert: { bg: 'bg-green-100', text: 'text-green-800', label: 'cert' },
                }[s.signal_type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: s.signal_type };
                return (
                  <div
                    key={i}
                    className="px-2 py-1.5 rounded border border-purple-100 bg-white/60 text-[10px]"
                  >
                    <div className="flex items-start gap-1.5 mb-0.5">
                      <span className={`px-1 py-0.5 rounded text-[8px] font-bold tracking-wider shrink-0 ${typeBadge.bg} ${typeBadge.text}`}>
                        {typeBadge.label}
                      </span>
                      <span className="font-semibold text-text-primary leading-tight flex-1 min-w-0">
                        {s.title}
                      </span>
                      <span className="text-[9px] text-gray-400 font-mono shrink-0">
                        {(s.relevance_score * 100).toFixed(0)}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-snug line-clamp-2 mt-1">{s.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {careerResult?.error && (
          <p className="mt-2 text-[10px] text-red-600">Error: {careerResult.error}</p>
        )}

        {/* Stay Ahead — mobility intelligence */}
        <div className="mt-3 pt-3 border-t border-purple-100">
          <button
            onClick={handleStayAhead}
            disabled={stayAheadLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
              stayAheadLoading
                ? "bg-purple-100 text-purple-400 cursor-wait"
                : "bg-white border border-purple-300 text-purple-700 hover:bg-purple-50"
            }`}
          >
            {stayAheadLoading ? "Scanning…" : "🎯 Stay Ahead — find my next jobs + experiences"}
          </button>
          {stayAheadStatus && (
            <p className="mt-1.5 text-[9px] text-purple-700 italic">{stayAheadStatus}</p>
          )}
        </div>

        {/* Scenario simulation */}
        <div className="mt-2">
          <button
            onClick={handleSimulateScenarios}
            disabled={simulating}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
              simulating
                ? "bg-purple-100 text-purple-400 cursor-wait"
                : "bg-white border border-purple-300 text-purple-700 hover:bg-purple-50"
            }`}
          >
            {simulating ? "Projecting…" : "🔮 Simulate career scenarios"}
          </button>
          {simulateStatus && (
            <p className="mt-1.5 text-[9px] text-purple-700 italic">{simulateStatus}</p>
          )}
        </div>
      </div>

      {/* V3: Pre-digest — third Perplexity Computer use case */}
      <div className="px-4 py-3 border-t border-gray-50 bg-gradient-to-br from-purple-50/40 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          <p className="text-[10px] text-purple-700 font-bold tracking-wider">⚙ PRE-DIGEST A DOC</p>
        </div>
        <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
          Paste a long doc URL. Perplexity Computer reads it deeply, Claude extracts 5 key concepts.
        </p>
        {!predigestOpen && !predigestResult && (
          <button
            onClick={() => setPredigestOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-all"
          >
            ⚙ Paste a URL
          </button>
        )}
        {(predigestOpen || predigestResult) && (
          <div className="space-y-1.5">
            <input
              type="url"
              value={predigestUrl}
              onChange={(e) => setPredigestUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePredigest();
              }}
              disabled={predigesting}
              placeholder="https://..."
              className="w-full px-2.5 py-2 rounded-lg text-[11px] border border-purple-200 focus:border-purple-500 focus:outline-none disabled:bg-gray-50"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handlePredigest}
                disabled={predigesting || !predigestUrl.trim()}
                className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                  predigesting
                    ? "bg-purple-100 text-purple-400 cursor-wait"
                    : !predigestUrl.trim()
                    ? "bg-purple-200 text-purple-400 cursor-not-allowed"
                    : "bg-purple-600 text-white hover:bg-purple-700"
                }`}
              >
                {predigesting ? "Reading..." : "⚙ Pre-digest"}
              </button>
              <button
                onClick={() => {
                  setPredigestOpen(false);
                  setPredigestResult(null);
                  setPredigestUrl("");
                }}
                className="px-2.5 py-2 rounded-lg text-[11px] text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {predigestResult && !predigestResult.error && (
          <div className="mt-2.5 px-2.5 py-2 rounded-lg bg-purple-50 border border-purple-100">
            <p className="text-[10px] text-purple-700 font-semibold tracking-wider mb-0.5">
              ✓ Digest delivered to chat
            </p>
            <p className="text-[10px] text-gray-500 leading-snug">
              {predigestResult.key_concepts?.length || 0} concepts · saves ~
              {predigestResult.reading_time_saved_minutes || 15} min
            </p>
          </div>
        )}
        {predigestResult?.error && (
          <p className="mt-2 text-[10px] text-red-600">Error: {predigestResult.error}</p>
        )}
      </div>

      {/* V3: Path Engine — Live Persistent Learning Paths */}
      <div className="px-4 py-3 border-t border-gray-50 bg-gradient-to-br from-green-50/40 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <p className="text-[10px] text-green-700 font-bold tracking-wider">⚡ PATH ENGINE</p>
        </div>
        <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
          Multi-goal management. Each goal has a live path that auto-adjusts on session, content, or staleness triggers.
        </p>
        <div className="space-y-1.5">
          <button
            onClick={handleShowGoals}
            disabled={pathLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
              pathLoading
                ? "bg-green-100 text-green-400 cursor-wait"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            🎯 Show my goals
          </button>
          <button
            onClick={handleTriggerPathAdjust}
            disabled={pathLoading}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
              pathLoading
                ? "bg-green-100 text-green-400 cursor-wait"
                : "bg-white border border-green-300 text-green-700 hover:bg-green-50"
            }`}
          >
            ⚡ Simulate session_complete
          </button>
        </div>
        {pathLastAction && (
          <p className="mt-2 text-[10px] text-green-700 italic">{pathLastAction}</p>
        )}
      </div>

      {/* V3: SME Marketplace V1 */}
      <div className="px-4 py-3 border-t border-gray-50 bg-gradient-to-br from-rose-50/40 to-transparent">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <p className="text-[10px] text-rose-700 font-bold tracking-wider">🤝 SME MARKETPLACE</p>
        </div>
        <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
          When AI isn't enough — find a human. Internal teammates (auto-derived from mastery) + curated external experts.
        </p>
        <input
          type="text"
          value={smeTopic}
          onChange={(e) => setSmeTopic(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleFindSMEs();
          }}
          disabled={smeLoading}
          placeholder="topic (e.g. Service Mesh)"
          className="w-full px-2.5 py-2 mb-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none disabled:bg-gray-50"
        />
        <button
          onClick={handleFindSMEs}
          disabled={smeLoading || !smeTopic.trim()}
          className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
            smeLoading
              ? "bg-rose-100 text-rose-400 cursor-wait"
              : !smeTopic.trim()
              ? "bg-rose-200 text-rose-400 cursor-not-allowed"
              : "bg-rose-600 text-white hover:bg-rose-700"
          }`}
        >
          {smeLoading ? "Matching…" : "🤝 Find an SME"}
        </button>
        {smeLastAction && (
          <p className="mt-2 text-[10px] text-rose-700 italic">{smeLastAction}</p>
        )}
      </div>

      {/* Seed demo content — dev only */}
      {isDev && (
        <div className="px-4 py-3 border-t border-gray-50">
          <button
            onClick={handleSeed}
            disabled={seeding || seedDone}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium transition-all ${
              seedDone
                ? 'bg-green-50 text-green-600 cursor-default'
                : seeding
                ? 'bg-gray-100 text-gray-400 cursor-wait'
                : 'bg-navy/5 text-navy hover:bg-navy/10'
            }`}
          >
            {seedDone ? 'Demo content seeded' : seeding ? 'Seeding...' : 'Seed demo content'}
          </button>
        </div>
      )}

      {/* Account actions at bottom */}
      <div className="mt-auto px-4 py-3 border-t border-gray-50 flex flex-col gap-0.5">
        <button
          onClick={() => openUserProfile()}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span className="text-[11px] text-gray-500 font-medium">Account & Preferences</span>
        </button>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg hover:bg-red-50 transition-colors text-left group"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 group-hover:text-red-500">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="text-[11px] text-gray-500 group-hover:text-red-500 font-medium">Sign out</span>
        </button>
      </div>
    </nav>
  );
}

function StackPill({ label, mode, hint }) {
  const live = mode === "live";
  const stub = mode === "stub" || mode === "client_stub";
  const notConnected = mode === "not_connected" || mode === "unreachable";
  const unknown = !live && !stub && !notConnected;

  const dot = live
    ? "bg-green-500"
    : stub
    ? "bg-amber-500"
    : notConnected
    ? "bg-gray-400"
    : "bg-gray-300";
  const textColor = live
    ? "text-green-700"
    : stub
    ? "text-amber-700"
    : notConnected
    ? "text-gray-500"
    : "text-gray-400";
  const stateLabel = live
    ? "live"
    : stub
    ? "stub"
    : notConnected
    ? "off"
    : unknown
    ? "..."
    : mode;

  return (
    <div className="flex items-center gap-2 px-1.5 py-1 rounded">
      <span className={`relative flex h-1.5 w-1.5 shrink-0`}>
        {live && (
          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50 animate-ping"></span>
        )}
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dot}`}></span>
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-text-primary truncate">{label}</span>
          <span className={`text-[8px] font-mono uppercase tracking-wider ${textColor}`}>{stateLabel}</span>
        </div>
        {hint && <p className="text-[9px] text-gray-400 truncate">{hint}</p>}
      </div>
    </div>
  );
}
