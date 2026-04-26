import { useState } from 'react'
import './index.css'
import SourcesNav from './components/SourcesNav'
import ChatPanel from './components/ChatPanel'
import ContextPanel from './components/ContextPanel'

export default function App() {
  const [contextData, setContextData] = useState({
    type: 'idle',
    goal: { name: 'Cloud Architect', readiness: 62, daysLeft: 250, streak: 8 },
  })

  return (
    <div className="flex h-screen w-screen bg-bg">
      {/* Sources Nav — Left dock */}
      <SourcesNav />
      {/* Chat Panel — Primary */}
      <ChatPanel onContextChange={setContextData} />
      {/* Context Panel — Right */}
      <ContextPanel data={contextData} />
    </div>
  )
}
