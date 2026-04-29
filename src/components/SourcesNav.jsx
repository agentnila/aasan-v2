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
  // SME self-registration form state
  const [smeMode, setSmeMode] = useState(null); // null | "register"
  const [smeRegistering, setSmeRegistering] = useState(false);
  const [smeForm, setSmeForm] = useState(() => ({
    name: "", role: "", subjects: "",
    schedule_window: "",
    timezone: typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC",
    languages: "en",
    rate_model: "kudos_only",
    rate_per_30min: "",
    rate_currency: "usd",
    expectations_from_students: "",
    bio: "",
    preferred_session_length: 30,
  }));
  const [resumeMode, setResumeMode] = useState(null); // null | "add" | "tailor"
  const [resumeText, setResumeText] = useState("");
  const [resumeLoading, setResumeLoading] = useState(false);
  const [resumeStatus, setResumeStatus] = useState(null);
  const [resumeJournalCount, setResumeJournalCount] = useState(8);
  // Agentic stack status — Bridge (sync) + Computer/Claude (async via /agent/status)
  const [bridgeLive, setBridgeLive] = useState(false);
  const [serverStatus, setServerStatus] = useState(null);
  const [statusRefreshing, setStatusRefreshing] = useState(false);

  // Collapsible sections — only one open by default to reduce nav density.
  // Sections in form-mode (smeMode/resumeMode/predigest open) are auto-forced open below.
  const [openSections, setOpenSections] = useState({
    sources: false,        // Connected + Connect More
    currency: false,       // Currency Watch
    career: false,         // Career Compass + Stay Ahead + Career Simulator
    predigest: false,      // Pre-digest a Doc
    goals: true,           // Goals & Path Engine — the anchor, default open
    sme: false,            // SME Marketplace
    resume: false,         // Resume · Service Record
  });

  const toggleSection = (id) =>
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));

  // Force-open sections when their input form mode is active
  const isOpen = (id) =>
    openSections[id]
    || (id === "sme" && smeMode === "register")
    || (id === "resume" && resumeMode != null)
    || (id === "predigest" && predigestOpen);

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

  async function handleShowResumeJournal() {
    setResumeLoading(true);
    setResumeStatus("Loading your service record…");
    try {
      const result = await agent.listJournal(user?.id || "demo-user");
      const n = result.entry_count || (result.entries || []).length;
      setResumeJournalCount(n);
      const summary = n === 0
        ? "Your service record is empty. Tell Peraasan what you've done — every entry is searchable forever."
        : `Your service record — ${n} entries across ${Object.keys(result.by_category || {}).length} categories. Search or filter inline.`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: { messageContent: summary, card: { type: "resume_journal", ...result } },
      }));
      setResumeStatus(`✓ ${n} entries posted to chat`);
    } catch (err) {
      setResumeStatus(`Error: ${err.message}`);
    }
    setResumeLoading(false);
  }

  async function handleShowMyBookings() {
    setSmeLoading(true);
    setSmeLastAction("Loading your bookings…");
    try {
      const result = await agent.listMyBookings(user?.id || "demo-user");
      const total = result?.total ?? 0;
      const summary = total === 0
        ? "No upcoming SME sessions. Browse the marketplace to find someone, or register as an SME to start receiving bookings."
        : `${total} upcoming session${total !== 1 ? "s" : ""} — ${result.counts?.as_learner || 0} you booked, ${result.counts?.as_sme || 0} where you're the SME.`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: { messageContent: summary, card: { type: "sme_bookings", ...result } },
      }));
      setSmeLastAction(`✓ ${total} bookings posted to chat`);
    } catch (err) {
      setSmeLastAction(`Error: ${err.message}`);
    }
    setSmeLoading(false);
  }

  async function handleBrowseSMEs() {
    setSmeLoading(true);
    setSmeLastAction("Loading marketplace…");
    try {
      const result = await agent.listSMEs({ activeOnly: true, limit: 100 });
      const n = result?.count ?? 0;
      const summary = n === 0
        ? "No SMEs registered yet. Be the first — click '📚 Become an SME'."
        : `${n} SMEs in the marketplace · ${result.registered_count || 0} self-registered + ${result.demo_seed_count || 0} curated. Search or filter inline.`;
      window.dispatchEvent(new CustomEvent("aasan:digest", {
        detail: { messageContent: summary, card: { type: "sme_browse", ...result } },
      }));
      setSmeLastAction(`✓ ${n} SMEs posted to chat`);
    } catch (err) {
      setSmeLastAction(`Error: ${err.message}`);
    }
    setSmeLoading(false);
  }

  async function handleStartSMERegister() {
    setSmeMode("register");
    setSmeLastAction(null);
    // Pre-fill from existing profile if user has one (idempotent edits)
    if (user?.id) {
      try {
        const existing = await agent.getSMEProfile(user.id);
        if (existing?.registered && existing.sme) {
          const s = existing.sme;
          setSmeForm({
            name: s.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
            role: s.role || "",
            subjects: (s.topics || []).join(", "),
            schedule_window: s.schedule_window || s.availability_window || "",
            timezone: s.timezone || (typeof Intl !== "undefined" ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC"),
            languages: (s.languages || ["en"]).join(", "),
            rate_model: s.rate_model || "kudos_only",
            rate_per_30min: String(s.rate_per_30min ?? ""),
            rate_currency: (s.rate_currency || "usd").toUpperCase(),
            expectations_from_students: s.expectations_from_students || "",
            bio: s.bio || "",
            preferred_session_length: Number(s.preferred_session_length || 30),
          });
        } else {
          setSmeForm(prev => ({ ...prev, name: `${user.firstName || ""} ${user.lastName || ""}`.trim() || prev.name }));
        }
      } catch { /* ignore */ }
    }
  }

  async function handleSubmitSMERegister() {
    setSmeRegistering(true);
    setSmeLastAction("Registering…");
    try {
      const subjects = smeForm.subjects.split(",").map(s => s.trim()).filter(Boolean);
      const languages = smeForm.languages.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
      const profile = {
        name: smeForm.name.trim(),
        role: smeForm.role.trim(),
        subjects,
        schedule_window: smeForm.schedule_window.trim(),
        timezone: smeForm.timezone,
        languages,
        rate_model: smeForm.rate_model,
        ...(smeForm.rate_model === "paid" ? {
          rate_per_30min: Number(smeForm.rate_per_30min) || 0,
          rate_currency: smeForm.rate_currency,
        } : {}),
        expectations_from_students: smeForm.expectations_from_students.trim(),
        bio: smeForm.bio.trim(),
        preferred_session_length: Number(smeForm.preferred_session_length),
      };
      const result = await agent.registerSME(user?.id || "demo-user", profile);
      if (result?.error) {
        setSmeLastAction(`Error: ${result.error}`);
      } else {
        const created = result?.created ? "registered" : "updated";
        const summary = `You're ${created} as an SME on ${subjects.length} topic${subjects.length !== 1 ? "s" : ""}: ${subjects.join(", ")}. Learners will see you in matches.`;
        window.dispatchEvent(new CustomEvent("aasan:digest", {
          detail: { messageContent: summary, card: { type: "sme_registered", ...result } },
        }));
        setSmeLastAction(`✓ ${created.charAt(0).toUpperCase() + created.slice(1)} · posted to chat`);
        setSmeMode(null);
      }
    } catch (err) {
      setSmeLastAction(`Error: ${err.message}`);
    }
    setSmeRegistering(false);
  }

  async function handleResumeSubmit() {
    const text = resumeText.trim();
    if (!text) return;
    setResumeLoading(true);
    if (resumeMode === "add") {
      setResumeStatus("Adding to your service record…");
      try {
        const result = await agent.addJournalEntry(user?.id || "demo-user", text);
        setResumeJournalCount(result.journal_size || resumeJournalCount + 1);
        const summary = `Logged in your service record: "${result.entry?.title || text.slice(0, 60)}"`;
        window.dispatchEvent(new CustomEvent("aasan:digest", {
          detail: { messageContent: summary, card: { type: "journal_added", ...result } },
        }));
        setResumeStatus(`✓ Added · ${result.journal_size || resumeJournalCount + 1} entries total`);
        setResumeText("");
        setResumeMode(null);
      } catch (err) {
        setResumeStatus(`Error: ${err.message}`);
      }
    } else if (resumeMode === "tailor") {
      setResumeStatus("Reading job posting + tailoring resume…");
      try {
        const isUrl = /^https?:\/\//.test(text);
        const result = await agent.tailorResume(
          user?.id || "demo-user",
          isUrl ? text : "",
          isUrl ? "" : text,
        );
        const summary = `Tailored resume for ${result.job_title} @ ${result.job_company} — ${Math.round((result.match_score || 0) * 100)}% match. ${result.highlighted_projects?.length || 0} projects highlighted from your record.`;
        window.dispatchEvent(new CustomEvent("aasan:digest", {
          detail: { messageContent: summary, card: { type: "tailored_resume", ...result } },
        }));
        setResumeStatus("✓ Tailored resume in chat");
        setResumeText("");
        setResumeMode(null);
      } catch (err) {
        setResumeStatus(`Error: ${err.message}`);
      }
    }
    setResumeLoading(false);
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

  // Inline header pattern for collapsible sections — keeps closures simple
  const SectionHeader = ({ id, color = "purple", icon, label, badge, accent = false }) => {
    const opened = isOpen(id);
    const colorClasses = {
      purple:  { dot: "bg-purple-500",  text: "text-purple-700",  bg: "from-purple-50/40" },
      green:   { dot: "bg-green-500",   text: "text-green-700",   bg: "from-green-50/40" },
      rose:    { dot: "bg-rose-500",    text: "text-rose-700",    bg: "from-rose-50/40" },
      emerald: { dot: "bg-emerald-500", text: "text-emerald-700", bg: "from-emerald-50/40" },
      gray:    { dot: "bg-gray-400",    text: "text-gray-600",    bg: "" },
    }[color] || { dot: "bg-gray-400", text: "text-gray-600", bg: "" };
    return (
      <button
        type="button"
        onClick={() => toggleSection(id)}
        className={`w-full flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50/60 transition-colors text-left border-t border-gray-50 ${accent && opened ? `bg-gradient-to-br ${colorClasses.bg} to-transparent` : ""}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${colorClasses.dot} shrink-0`} />
        <span className={`text-[10px] font-bold tracking-wider ${colorClasses.text}`}>
          {icon ? `${icon} ` : ""}{label}
        </span>
        {badge != null && (
          <span className={`ml-auto text-[9px] font-mono ${colorClasses.text} opacity-70`}>{badge}</span>
        )}
        <span className={`text-[9px] text-gray-400 transition-transform ${badge != null ? "ml-1" : "ml-auto"} ${opened ? "rotate-90" : ""}`}>▶</span>
      </button>
    );
  };

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

      {/* Sources — connected + available to connect (merged section) */}
      <SectionHeader id="sources" color="gray" icon="🔗" label="CONTENT SOURCES" badge={`${connectedCount}/${sources.length}`} />
      {isOpen("sources") && (
        <div className="px-4 pb-3 pt-2 border-b border-gray-50">
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1.5">CONNECTED · {connectedCount}</p>
          <div className="flex flex-col gap-1.5 mb-3">
            {sources.filter((s) => s.connected).map((source) => (
              <div key={source.name} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className={`w-6 h-6 rounded-md ${source.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>{source.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-text-primary truncate">{source.name}</p>
                  <p className="text-[9px] text-gray-400">{source.items.toLocaleString()} items</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
              </div>
            ))}
          </div>
          <p className="text-[9px] text-gray-400 font-semibold tracking-wider mb-1.5">CONNECT MORE</p>
          <div className="flex flex-col gap-1.5">
            {sources.filter((s) => !s.connected).map((source) => (
              <div key={source.name} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border border-dashed border-gray-200 hover:border-navy/30 transition-colors cursor-pointer group">
                <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-gray-400 text-[9px] font-bold shrink-0 group-hover:bg-navy/5 group-hover:text-navy transition-colors">{source.icon}</div>
                <p className="text-[11px] text-gray-500 group-hover:text-text-primary transition-colors flex-1 truncate">{source.name}</p>
                <span className="text-[9px] text-navy font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">+</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* V3: Currency Watch — full agentic loop demo */}
      <SectionHeader id="currency" color="purple" icon="⚙" label="CURRENCY WATCH" accent />
      {isOpen("currency") && (
      <div className="px-4 pb-3 pt-1 bg-gradient-to-br from-purple-50/40 to-transparent">
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
      )}

      {/* V3: Career Compass — second Perplexity Computer use case */}
      <SectionHeader id="career" color="purple" icon="⚙" label="CAREER COMPASS" accent />
      {isOpen("career") && (
      <div className="px-4 pb-3 pt-1 bg-gradient-to-br from-purple-50/40 to-transparent">
        <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
          Scrapes job market + course launches + vendor certs via Perplexity Computer. Ranks signals by relevance to your role. Includes Stay Ahead + Career Simulator.
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
      )}

      {/* V3: Pre-digest — third Perplexity Computer use case */}
      <SectionHeader id="predigest" color="purple" icon="⚙" label="PRE-DIGEST A DOC" accent />
      {isOpen("predigest") && (
      <div className="px-4 pb-3 pt-1 bg-gradient-to-br from-purple-50/40 to-transparent">
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
      )}

      {/* V3: Path Engine — Live Persistent Learning Paths */}
      <SectionHeader id="goals" color="green" icon="🎯" label="GOALS & PATHS" accent />
      {isOpen("goals") && (
      <div className="px-4 pb-3 pt-1 bg-gradient-to-br from-green-50/40 to-transparent">
        <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
          Multi-goal management. Each goal has a live path that auto-adjusts on session, content, or staleness triggers.
        </p>
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
        {pathLastAction && (
          <p className="mt-2 text-[10px] text-green-700 italic">{pathLastAction}</p>
        )}
      </div>
      )}

      {/* V3: SME Marketplace V1 */}
      <SectionHeader id="sme" color="rose" icon="🤝" label="SME MARKETPLACE" accent />
      {isOpen("sme") && (
      <div className="px-4 pb-3 pt-1 bg-gradient-to-br from-rose-50/40 to-transparent">
        {smeMode === "register" ? (
          <>
            <p className="text-[10px] text-gray-500 mb-2 leading-relaxed">
              Tell learners who you are, what you'll teach, and what to expect. Idempotent — re-submit any time to update.
            </p>
            <div className="space-y-1.5">
              <input value={smeForm.name} onChange={(e) => setSmeForm({...smeForm, name: e.target.value})}
                placeholder="Display name *"
                className="w-full px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none" />
              <input value={smeForm.role} onChange={(e) => setSmeForm({...smeForm, role: e.target.value})}
                placeholder="Role / title (e.g. Senior SRE, Platform team)"
                className="w-full px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none" />
              <textarea value={smeForm.subjects} onChange={(e) => setSmeForm({...smeForm, subjects: e.target.value})}
                placeholder="Subjects you'll teach * (comma-separated, e.g. Service Mesh, Istio, mTLS)"
                rows={2}
                className="w-full px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none resize-none" />
              <input value={smeForm.schedule_window} onChange={(e) => setSmeForm({...smeForm, schedule_window: e.target.value})}
                placeholder="Schedule window (e.g. Tue/Thu 4-6pm, 30-min slots)"
                className="w-full px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none" />
              <div className="grid grid-cols-2 gap-1.5">
                <input value={smeForm.timezone} onChange={(e) => setSmeForm({...smeForm, timezone: e.target.value})}
                  placeholder="Time zone"
                  title="IANA time zone (auto-detected from your browser)"
                  className="px-2 py-1.5 rounded-lg text-[10px] border border-rose-200 focus:border-rose-500 focus:outline-none" />
                <input value={smeForm.languages} onChange={(e) => setSmeForm({...smeForm, languages: e.target.value})}
                  placeholder="Languages (en, es)"
                  className="px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none" />
              </div>
              <div className="flex items-center gap-1.5">
                <select value={smeForm.rate_model} onChange={(e) => setSmeForm({...smeForm, rate_model: e.target.value})}
                  className="flex-1 px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none bg-white">
                  <option value="free">Free</option>
                  <option value="kudos_only">Kudos only</option>
                  <option value="paid">Paid</option>
                </select>
                {smeForm.rate_model === "paid" && (
                  <>
                    <input value={smeForm.rate_per_30min} onChange={(e) => setSmeForm({...smeForm, rate_per_30min: e.target.value})}
                      placeholder="$/30 min" type="number" min="0"
                      className="w-20 px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none" />
                    <select value={smeForm.rate_currency} onChange={(e) => setSmeForm({...smeForm, rate_currency: e.target.value})}
                      className="w-16 px-1 py-1.5 rounded-lg text-[10px] border border-rose-200 focus:border-rose-500 focus:outline-none bg-white uppercase">
                      <option value="usd">USD</option>
                      <option value="eur">EUR</option>
                      <option value="inr">INR</option>
                      <option value="gbp">GBP</option>
                    </select>
                  </>
                )}
              </div>
              <select value={smeForm.preferred_session_length} onChange={(e) => setSmeForm({...smeForm, preferred_session_length: Number(e.target.value)})}
                className="w-full px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none bg-white">
                <option value={15}>15-min sessions</option>
                <option value={30}>30-min sessions</option>
                <option value={45}>45-min sessions</option>
                <option value={60}>60-min sessions</option>
              </select>
              <textarea value={smeForm.expectations_from_students} onChange={(e) => setSmeForm({...smeForm, expectations_from_students: e.target.value})}
                placeholder="What you expect from students before booking (e.g. 'Read the README. Watch the 8-min Istio overview. Bring 1 specific question, not — explain Istio.')"
                rows={3}
                className="w-full px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none resize-none" />
              <textarea value={smeForm.bio} onChange={(e) => setSmeForm({...smeForm, bio: e.target.value})}
                placeholder="Short bio (1-2 sentences)"
                rows={2}
                className="w-full px-2 py-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none resize-none" />
              <div className="flex gap-1.5">
                <button onClick={handleSubmitSMERegister}
                  disabled={smeRegistering || !smeForm.name.trim() || !smeForm.subjects.trim()}
                  className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold ${
                    smeRegistering ? "bg-rose-100 text-rose-400 cursor-wait"
                    : (!smeForm.name.trim() || !smeForm.subjects.trim()) ? "bg-rose-200 text-rose-400 cursor-not-allowed"
                    : "bg-rose-600 text-white hover:bg-rose-700"
                  }`}>
                  {smeRegistering ? "Saving…" : "✅ Save my SME profile"}
                </button>
                <button onClick={() => { setSmeMode(null); setSmeLastAction(null); }}
                  className="px-2.5 py-2 rounded-lg text-[11px] text-gray-500 hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
              When AI isn't enough — find a human. Or share what you know — register as an SME and earn kudos / get booked.
            </p>
            <input
              type="text"
              value={smeTopic}
              onChange={(e) => setSmeTopic(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleFindSMEs(); }}
              disabled={smeLoading}
              placeholder="topic (e.g. Service Mesh)"
              className="w-full px-2.5 py-2 mb-1.5 rounded-lg text-[11px] border border-rose-200 focus:border-rose-500 focus:outline-none disabled:bg-gray-50"
            />
            <div className="space-y-1.5">
              <button
                onClick={handleFindSMEs}
                disabled={smeLoading || !smeTopic.trim()}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                  smeLoading ? "bg-rose-100 text-rose-400 cursor-wait"
                    : !smeTopic.trim() ? "bg-rose-200 text-rose-400 cursor-not-allowed"
                    : "bg-rose-600 text-white hover:bg-rose-700"
                }`}
              >
                {smeLoading ? "Matching…" : "🤝 Find an SME"}
              </button>
              <button
                onClick={handleBrowseSMEs}
                disabled={smeLoading}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                  smeLoading ? "bg-rose-100 text-rose-400 cursor-wait"
                    : "bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
                }`}
              >
                👥 Browse the marketplace
              </button>
              <button
                onClick={handleShowMyBookings}
                disabled={smeLoading}
                className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                  smeLoading ? "bg-rose-100 text-rose-400 cursor-wait"
                    : "bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
                }`}
              >
                📅 My bookings
              </button>
              <button
                onClick={handleStartSMERegister}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold bg-white border border-rose-300 text-rose-700 hover:bg-rose-50"
              >
                📚 Become an SME
              </button>
            </div>
          </>
        )}
        {smeLastAction && (
          <p className="mt-2 text-[10px] text-rose-700 italic">{smeLastAction}</p>
        )}
      </div>
      )}

      {/* V3: Resume Module — living service record + tailored resume */}
      <SectionHeader id="resume" color="emerald" icon="📋" label="SERVICE RECORD" badge={resumeJournalCount} accent />
      {isOpen("resume") && (
      <div className="px-4 pb-3 pt-1 bg-gradient-to-br from-emerald-50/40 to-transparent">
        <p className="text-[10px] text-gray-500 mb-2.5 leading-relaxed">
          Your living service record. Tell Peraasan what you did. When a job posting lands, get a tailored resume drawn from your real entries.
        </p>

        {!resumeMode && (
          <div className="space-y-1.5">
            <button
              onClick={() => { setResumeMode("add"); setResumeStatus(null); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
            >
              ✍ Log a work entry
            </button>
            <button
              onClick={handleShowResumeJournal}
              disabled={resumeLoading}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all ${
                resumeLoading
                  ? "bg-emerald-100 text-emerald-400 cursor-wait"
                  : "bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {resumeLoading && resumeStatus?.startsWith("Loading") ? "Loading…" : "📖 Show my record"}
            </button>
            <button
              onClick={() => { setResumeMode("tailor"); setResumeStatus(null); }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              📝 Tailor a resume to a job
            </button>
          </div>
        )}

        {resumeMode === "add" && (
          <div className="space-y-1.5">
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              disabled={resumeLoading}
              placeholder='e.g. "Just shipped the new caching layer. Reduced p95 latency from 200ms to 80ms. Presented results to the platform team."'
              rows={4}
              className="w-full px-2.5 py-2 rounded-lg text-[11px] border border-emerald-200 focus:border-emerald-500 focus:outline-none resize-none disabled:bg-gray-50"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleResumeSubmit}
                disabled={resumeLoading || !resumeText.trim()}
                className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold ${
                  resumeLoading
                    ? "bg-emerald-100 text-emerald-400 cursor-wait"
                    : !resumeText.trim()
                    ? "bg-emerald-200 text-emerald-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {resumeLoading ? "Saving…" : "✍ Add to record"}
              </button>
              <button
                onClick={() => { setResumeMode(null); setResumeText(""); setResumeStatus(null); }}
                className="px-2.5 py-2 rounded-lg text-[11px] text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resumeMode === "tailor" && (
          <div className="space-y-1.5">
            <input
              type="text"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleResumeSubmit(); }}
              disabled={resumeLoading}
              placeholder="Paste job URL (or paste the JD)"
              className="w-full px-2.5 py-2 rounded-lg text-[11px] border border-emerald-200 focus:border-emerald-500 focus:outline-none disabled:bg-gray-50"
            />
            <div className="flex gap-1.5">
              <button
                onClick={handleResumeSubmit}
                disabled={resumeLoading || !resumeText.trim()}
                className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold ${
                  resumeLoading
                    ? "bg-emerald-100 text-emerald-400 cursor-wait"
                    : !resumeText.trim()
                    ? "bg-emerald-200 text-emerald-400 cursor-not-allowed"
                    : "bg-emerald-600 text-white hover:bg-emerald-700"
                }`}
              >
                {resumeLoading ? "Tailoring…" : "📝 Tailor resume"}
              </button>
              <button
                onClick={() => { setResumeMode(null); setResumeText(""); setResumeStatus(null); }}
                className="px-2.5 py-2 rounded-lg text-[11px] text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {resumeStatus && (
          <p className="mt-2 text-[10px] text-emerald-700 italic">{resumeStatus}</p>
        )}
      </div>
      )}

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
