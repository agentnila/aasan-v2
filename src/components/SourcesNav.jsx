import { useState } from "react";
import { useClerk } from "@clerk/clerk-react";

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
  const connectedCount = sources.filter((s) => s.connected).length;
  const { openUserProfile, signOut } = useClerk();

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
