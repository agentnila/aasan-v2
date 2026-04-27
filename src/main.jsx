import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'
import DemoApp from './demo/DemoApp.jsx'

const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const isDemo = window.location.pathname.startsWith('/demo')

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isDemo ? (
      <DemoApp />
    ) : (
      <ClerkProvider publishableKey={clerkKey}>
        <App />
      </ClerkProvider>
    )}
  </StrictMode>,
)
