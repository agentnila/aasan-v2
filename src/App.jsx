import { useState, useEffect } from 'react'
import { SignedIn, SignedOut, SignIn, useUser } from '@clerk/clerk-react'
import './index.css'
import SourcesNav from './components/SourcesNav'
import ChatPanel from './components/ChatPanel'
import ContextPanel from './components/ContextPanel'
import { loadContext } from './services/api'

function AasanApp() {
  const { user } = useUser()
  const [contextData, setContextData] = useState({
    type: 'idle',
    goal: { name: 'Cloud Architect', readiness: 62, daysLeft: 250, streak: 8 },
  })
  const [backendContext, setBackendContext] = useState(null)
  const [contextLoading, setContextLoading] = useState(true)

  // Load real context from Render backend on mount
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
      <SourcesNav />
      <ChatPanel
        onContextChange={setContextData}
        userName={user?.firstName || 'there'}
        context={backendContext}
        userId={user?.id}
      />
      <ContextPanel
        data={contextData}
        user={user}
        context={backendContext}
        contextLoading={contextLoading}
      />
    </div>
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
            <p className="text-[11px] text-gray-400 tracking-[0.15em] uppercase mb-8">Your Personal University</p>
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
