import { NavLink } from "react-router-dom";

/**
 * Module rail — far-left icon strip, persistent across all modules.
 * Six modules: Kudil (home) · Library · Paths · Stay Ahead · Resume · Marketplace.
 *
 * Resist the urge to add more icons here. Five fits, six is fine, twelve is a
 * disaster. New capabilities go INSIDE one of the modules — never as a top-level
 * rail icon. See feedback_module_first_ia.md.
 */

const MODULES = [
  { id: "kudil",      to: "/",            icon: "🏠", label: "Kudil",       color: "text-gray-700",     activeBg: "bg-navy/10 text-navy" },
  { id: "library",    to: "/library",     icon: "📚", label: "Library",     color: "text-gray-700",     activeBg: "bg-blue-50 text-blue-700" },
  { id: "paths",      to: "/paths",       icon: "🎯", label: "Paths",       color: "text-gray-700",     activeBg: "bg-green-50 text-green-700" },
  { id: "stay-ahead", to: "/stay-ahead",  icon: "🛡",  label: "Stay Ahead",  color: "text-gray-700",     activeBg: "bg-purple-50 text-purple-700" },
  { id: "resume",     to: "/resume",      icon: "📋", label: "Resume",      color: "text-gray-700",     activeBg: "bg-emerald-50 text-emerald-700" },
  { id: "marketplace",to: "/marketplace", icon: "🤝", label: "Marketplace", color: "text-gray-700",     activeBg: "bg-rose-50 text-rose-700" },
];

export default function ModuleRail() {
  return (
    <aside className="w-[60px] min-w-[60px] bg-white border-r border-gray-100 flex flex-col items-center py-3 gap-1">
      {/* Compact crest mark — Aasan brand anchor */}
      <div className="w-8 h-8 rounded-lg bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center mb-2 shadow-sm" title="Aasan">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-gold">
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>

      {MODULES.map((m) => (
        <NavLink
          key={m.id}
          to={m.to}
          end={m.to === "/"}
          className={({ isActive }) =>
            `w-11 h-11 rounded-xl flex flex-col items-center justify-center transition-all relative group ${
              isActive
                ? `${m.activeBg} font-semibold`
                : `${m.color} hover:bg-gray-50`
            }`
          }
          title={m.label}
        >
          <span className="text-[16px] leading-none">{m.icon}</span>
          <span className="text-[8px] mt-0.5 tracking-wide leading-none">{m.label.split(" ")[0]}</span>
        </NavLink>
      ))}

      <div className="mt-auto flex flex-col gap-1">
        <button
          className="w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-all"
          title="Settings (coming soon)"
          disabled
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
