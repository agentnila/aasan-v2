import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import agent from "../services/agentService";

/**
 * Module rail — far-left icon strip, persistent across all modules.
 * Phase H · Canvas-first redesign: slim 48px (was 60px). Icons only with
 * hover-reveal labels via tooltip. User avatar at the bottom opens a
 * compact menu (profile · sign out). Settings cog stays admin-only.
 *
 * Resist the urge to add more icons here. Seven fits, eight is fine,
 * twelve is a disaster. New capabilities go INSIDE one of the modules —
 * never as a top-level rail icon. See feedback_module_first_ia.md.
 */

const MODULES = [
  { id: "kudil",      to: "/",            icon: "🏠", label: "Kudil",       activeBg: "bg-navy/10 text-navy" },
  { id: "library",    to: "/library",     icon: "📚", label: "Library",     activeBg: "bg-blue-50 text-blue-700" },
  { id: "paths",      to: "/paths",       icon: "🎯", label: "Paths",       activeBg: "bg-green-50 text-green-700" },
  { id: "stay-ahead", to: "/stay-ahead",  icon: "🛡",  label: "Stay Ahead", activeBg: "bg-purple-50 text-purple-700" },
  { id: "resume",     to: "/resume",      icon: "📋", label: "Resume",      activeBg: "bg-emerald-50 text-emerald-700" },
  { id: "marketplace",to: "/marketplace", icon: "🤝", label: "Marketplace", activeBg: "bg-rose-50 text-rose-700" },
  { id: "team",       to: "/team",        icon: "👥", label: "Team",        activeBg: "bg-amber-50 text-amber-700" },
];

export default function ModuleRail() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    agent.getMe(user?.id || "demo-user").then((me) => {
      if (cancelled) return;
      setIsAdmin(!!me?.is_admin);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  // Close menu on outside click
  useEffect(() => {
    function onClick(e) {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  const initials = (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "");
  const avatarText = initials.toUpperCase() || "U";

  return (
    <aside className="w-12 min-w-[48px] bg-white border-r border-gray-100 flex flex-col items-center py-3 gap-1.5 shrink-0">
      {/* Compact crest mark — Aasan brand anchor */}
      <div
        className="w-8 h-8 rounded-lg bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center mb-2 shadow-sm relative group"
        title="Aasan"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-gold">
          <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </div>

      {MODULES.map((m) => (
        <NavLink
          key={m.id}
          to={m.to}
          end={m.to === "/"}
          className={({ isActive }) =>
            `w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group ${
              isActive
                ? `${m.activeBg} font-semibold`
                : "text-gray-500 hover:bg-gray-50"
            }`
          }
        >
          <span className="text-[16px] leading-none">{m.icon}</span>
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {m.label}
          </span>
        </NavLink>
      ))}

      <div className="mt-auto flex flex-col items-center gap-1.5 relative" ref={menuRef}>
        {isAdmin ? (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `w-9 h-9 rounded-lg flex items-center justify-center transition-all relative group ${
                isActive ? "bg-rose-50 text-rose-700" : "text-gray-400 hover:bg-gray-50 hover:text-gray-700"
              }`
            }
          >
            <SettingsIcon />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Admin Console
            </span>
          </NavLink>
        ) : (
          <button
            className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-300 cursor-not-allowed"
            title="Settings (admin only)"
            disabled
          >
            <SettingsIcon />
          </button>
        )}

        {/* User avatar opens a small menu */}
        <button
          onClick={() => setMenuOpen(o => !o)}
          className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold hover:ring-2 hover:ring-rose-200 transition-all relative group"
        >
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={avatarText} className="w-full h-full rounded-full object-cover" />
          ) : (
            avatarText
          )}
          <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
            {user?.firstName || "Account"}
          </span>
        </button>

        {menuOpen && (
          <div className="absolute bottom-0 left-full ml-2 bg-white border border-gray-200 rounded-xl shadow-xl py-1 min-w-[200px] z-50">
            <div className="px-3 py-2 border-b border-gray-100">
              <p className="text-[12px] font-semibold text-text-primary truncate">{user?.fullName || user?.firstName || "Signed in"}</p>
              <p className="text-[10px] text-gray-500 truncate">{user?.primaryEmailAddress?.emailAddress || ""}</p>
            </div>
            <button
              onClick={() => { setMenuOpen(false); navigate("/profile"); }}
              className="w-full text-left text-[12px] px-3 py-2 hover:bg-gray-50 text-gray-700 flex items-center gap-2"
            >
              <span>👤</span>
              <span>View profile</span>
            </button>
            <button
              onClick={() => { setMenuOpen(false); signOut?.(); }}
              className="w-full text-left text-[12px] px-3 py-2 hover:bg-gray-50 text-gray-700 border-t border-gray-100"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
