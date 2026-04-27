import { useState, useEffect } from 'react'
import DemoLanding from './DemoLanding'
import { scenarios } from './scenarios'

// Tiny path-based router. Reads window.location, renders the matching scenario.
// Listens for popstate so back/forward buttons work.
export default function DemoApp() {
  const [path, setPath] = useState(window.location.pathname)

  useEffect(() => {
    const onNav = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onNav)
    window.addEventListener('demo:navigate', onNav)
    return () => {
      window.removeEventListener('popstate', onNav)
      window.removeEventListener('demo:navigate', onNav)
    }
  }, [])

  // Match /demo or /demo/ → landing
  if (path === '/demo' || path === '/demo/') {
    return <DemoLanding />
  }

  // Match /demo/<id> → scenario
  const slug = path.replace(/^\/demo\//, '').replace(/\/$/, '')
  const scenario = scenarios.find((s) => s.slug === slug || String(s.id) === slug)

  if (!scenario) {
    return <DemoLanding notFound={slug} />
  }

  const Component = scenario.component
  return <Component scenario={scenario} />
}

export function navigate(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new Event('demo:navigate'))
}
