import { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-react'
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom'
import './index.css'
import ModuleRail from './components/ModuleRail'
import { ModuleLayout } from './components/ModuleCanvas'
import KudilCanvas from './components/canvases/KudilCanvas'
import LibraryCanvas from './components/canvases/LibraryCanvas'
import PathsCanvas from './components/canvases/PathsCanvas'
import StayAheadCanvas from './components/canvases/StayAheadCanvas'
import ResumeCanvas from './components/canvases/ResumeCanvas'
import MarketplaceCanvas from './components/canvases/MarketplaceCanvas'
import TeamCanvas from './components/canvases/TeamCanvas'
import AdminCanvas from './components/canvases/AdminCanvas'
import ProfileCanvas from './components/canvases/ProfileCanvas'
import { loadContext } from './services/api'

/**
 * Module-first IA · Phase H (canvas-first redesign):
 *   ModuleRail (48px) | full-bleed canvas | slide-out ContextPanel | floating ⌘K CommandBar
 *
 * Kudil (/) renders KudilCanvas — a real landing page (greeting · today · 6-tile
 * module grid · recent dispatches). Chat moved into the universal slide-over
 * triggered by "Ask Peraasan" in the CommandBar. The legacy left SourcesNav is gone.
 */

function ModuleShell({ module, children }) {
  const { user } = useUser()
  const [contextData, setContextData] = useState({
    type: 'idle',
    goal: { name: 'Cloud Architect', readiness: 62, daysLeft: 250, streak: 8 },
  })
  const [backendContext, setBackendContext] = useState(null)
  const [contextLoading, setContextLoading] = useState(true)

  useEffect(() => {
    if (!user?.id) return
    setContextLoading(true)
    loadContext(user.id)
      .then((data) => {
        setBackendContext(data)
        setContextLoading(false)
      })
      .catch((err) => {
        console.error('[Aasan] Failed to load context:', err)
        setContextLoading(false)
      })
  }, [user?.id])

  return (
    <div className="flex h-screen w-screen bg-bg">
      <ModuleRail />
      <ModuleLayout
        module={module}
        contextData={contextData}
        setContextData={setContextData}
        backendContext={backendContext}
        contextLoading={contextLoading}
      >
        {children}
      </ModuleLayout>
    </div>
  )
}

function AasanApp() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ModuleShell module="kudil"><KudilCanvas /></ModuleShell>} />
        <Route path="/kudil" element={<ModuleShell module="kudil"><KudilCanvas /></ModuleShell>} />
        <Route path="/library" element={<ModuleShell module="library"><LibraryCanvas /></ModuleShell>} />
        <Route path="/paths" element={<ModuleShell module="paths"><PathsCanvas /></ModuleShell>} />
        <Route path="/stay-ahead" element={<ModuleShell module="stay-ahead"><StayAheadCanvas /></ModuleShell>} />
        <Route path="/resume" element={<ModuleShell module="resume"><ResumeCanvas /></ModuleShell>} />
        <Route path="/marketplace" element={<ModuleShell module="marketplace"><MarketplaceCanvas /></ModuleShell>} />
        <Route path="/team" element={<ModuleShell module="team"><TeamCanvas /></ModuleShell>} />
        <Route path="/admin" element={<ModuleShell module="admin"><AdminCanvas /></ModuleShell>} />
        <Route path="/profile" element={<ModuleShell module="profile"><ProfileCanvas /></ModuleShell>} />
        {/* Catch-all → Kudil */}
        <Route path="*" element={<ModuleShell module="kudil"><KudilCanvas /></ModuleShell>} />
      </Routes>
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <>
      <SignedOut>
        <div className="h-screen w-screen bg-bg flex items-center justify-center">
          <div className="text-center">
            {/* Logo */}
            <div className="w-16 h-16 rounded-full bg-gradient-to-b from-navy to-[#0f2a52] flex items-center justify-center shadow-md border border-navy/20 mx-auto mb-6">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" className="text-gold">
                <path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M7 10c0 0 2.5-0.5 5 0.5v6c-2.5-1-5-0.5-5-0.5v-6z" fill="currentColor" opacity="0.3" />
                <path d="M17 10c0 0-2.5-0.5-5 0.5v6c2.5-1 5-0.5 5-0.5v-6z" fill="currentColor" opacity="0.3" />
                <circle cx="12" cy="6.5" r="1.2" fill="currentColor" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl font-bold text-navy mb-1">Aasan</h1>
            <p className="text-[11px] text-gray-400 tracking-[0.15em] uppercase mb-8">Your Career Operating System</p>
            <SignIn
              appearance={{
                elements: {
                  rootBox: 'mx-auto',
                  card: 'shadow-lg border border-gray-100',
                  headerTitle: 'font-serif',
                  formButtonPrimary: 'bg-navy hover:bg-navy/90',
                },
              }}
            />
          </div>
        </div>
      </SignedOut>
      <SignedIn>
        <AasanApp />
      </SignedIn>
    </>
  )
}
