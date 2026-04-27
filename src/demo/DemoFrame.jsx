import { useState, useEffect } from 'react'
import Narrator from './Narrator'
import { scenarios } from './scenarios'
import { navigate } from './DemoApp'

/**
 * Wraps a scenario. Provides:
 *  - Top bar with scenario title, prev/next, "back to demo home"
 *  - Right-side collapsible Narrator with the scenario script
 *  - Children render the actual scene UI
 */
export default function DemoFrame({
  scenario,
  sceneIndex,
  setSceneIndex,
  scenes,
  children,
  onAgenticMoment, // optional flag — adds a glow when an agentic action just fired
}) {
  const idx = scenarios.findIndex((s) => s.id === scenario.id)
  const prev = scenarios[idx - 1]
  const next = scenarios[idx + 1]

  const [narratorOpen, setNarratorOpen] = useState(true)

  // Keyboard nav: arrow keys advance scenes
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight' && sceneIndex < scenes.length - 1) {
        setSceneIndex(sceneIndex + 1)
      } else if (e.key === 'ArrowLeft' && sceneIndex > 0) {
        setSceneIndex(sceneIndex - 1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [sceneIndex, scenes.length, setSceneIndex])

  return (
    <div className="h-screen w-screen flex flex-col bg-bg overflow-hidden">
      {/* Top bar */}
      <div className="h-12 bg-white border-b border-gray-100 px-4 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate('/demo')}
          className="text-[11px] text-gray-500 hover:text-navy flex items-center gap-1.5 px-2 py-1 rounded hover:bg-gray-50"
          title="Back to scenarios"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          All scenarios
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-mono text-gray-400">{String(scenario.id).padStart(2, '0')}</span>
          <span className="text-[12px] font-semibold text-text-primary truncate">{scenario.title}</span>
          <span className="text-[10px] text-gray-400 uppercase tracking-wider hidden sm:inline">· {scenario.persona}</span>
        </div>
        <div className="flex-1" />

        {/* Scene progress dots */}
        <div className="flex items-center gap-1 mr-3">
          {scenes.map((_, i) => (
            <button
              key={i}
              onClick={() => setSceneIndex(i)}
              className={`w-1.5 h-1.5 rounded-full transition-all ${
                i === sceneIndex
                  ? 'bg-navy w-4'
                  : i < sceneIndex
                  ? 'bg-navy/40'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
              title={`Scene ${i + 1}`}
            />
          ))}
        </div>

        {/* Prev / Next scene */}
        <div className="flex items-center gap-1">
          <button
            disabled={sceneIndex === 0}
            onClick={() => setSceneIndex(sceneIndex - 1)}
            className="px-2 py-1 rounded text-[11px] text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Prev
          </button>
          {sceneIndex < scenes.length - 1 ? (
            <button
              onClick={() => setSceneIndex(sceneIndex + 1)}
              className="px-3 py-1 rounded bg-navy text-white text-[11px] font-medium hover:bg-navy/90"
            >
              Next →
            </button>
          ) : next ? (
            <button
              onClick={() => navigate(`/demo/${next.slug}`)}
              className="px-3 py-1 rounded bg-gold text-white text-[11px] font-medium hover:bg-gold/90"
            >
              Next scenario →
            </button>
          ) : (
            <button
              onClick={() => navigate('/demo')}
              className="px-3 py-1 rounded bg-gold text-white text-[11px] font-medium hover:bg-gold/90"
            >
              ✓ Demo complete
            </button>
          )}
        </div>

        <button
          onClick={() => setNarratorOpen(!narratorOpen)}
          className={`ml-2 px-2 py-1 rounded text-[10px] font-medium ${
            narratorOpen ? 'bg-gold/10 text-gold' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
          }`}
          title="Toggle narrator"
        >
          {narratorOpen ? '◉ Narrator on' : '○ Narrator off'}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className={`flex-1 overflow-hidden transition-all ${narratorOpen ? 'mr-[340px]' : 'mr-0'}`}>
          {children}
        </div>

        {/* Narrator (collapsible right rail) */}
        {narratorOpen && (
          <Narrator
            scenario={scenario}
            scene={scenes[sceneIndex]}
            sceneIndex={sceneIndex}
            totalScenes={scenes.length}
            onAgenticMoment={onAgenticMoment}
          />
        )}
      </div>
    </div>
  )
}
