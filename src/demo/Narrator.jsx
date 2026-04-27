/**
 * Right-rail narrator. Shows the current scene's script + agentic callout.
 * Pure presentation; no state of its own.
 */
export default function Narrator({ scenario, scene, sceneIndex, totalScenes }) {
  return (
    <aside className="absolute right-0 top-0 bottom-0 w-[340px] bg-white border-l border-gray-100 overflow-y-auto no-scrollbar">
      <div className="px-5 py-4 border-b border-gray-50 sticky top-0 bg-white z-10">
        <p className="text-[9px] text-gray-400 font-semibold tracking-wider">NARRATOR · SCENE {sceneIndex + 1} OF {totalScenes}</p>
        <h3 className="font-serif text-[15px] font-bold text-navy mt-1 leading-tight">{scene.title}</h3>
      </div>

      <div className="px-5 py-4 space-y-4">
        {/* What's happening */}
        <div>
          <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1.5">WHAT'S HAPPENING</p>
          <p className="text-[13px] text-text-primary leading-relaxed">{scene.narration}</p>
        </div>

        {/* Agentic callout */}
        {scene.agentic && (
          <div className="bg-gold/5 border-l-2 border-gold rounded-r-lg px-3 py-2.5">
            <p className="text-[10px] text-gold font-bold tracking-wider mb-1">⚡ AGENTIC MOMENT</p>
            <p className="text-[12px] text-text-primary leading-relaxed">{scene.agentic}</p>
          </div>
        )}

        {/* What to point out */}
        {scene.callouts && scene.callouts.length > 0 && (
          <div>
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1.5">POINT OUT</p>
            <ul className="space-y-1.5">
              {scene.callouts.map((c, i) => (
                <li key={i} className="text-[12px] text-gray-600 leading-relaxed flex gap-2">
                  <span className="text-navy mt-0.5">•</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action prompt */}
        {scene.action && (
          <div className="bg-navy/5 rounded-lg px-3 py-2.5">
            <p className="text-[10px] text-navy font-bold tracking-wider mb-1">YOUR TURN</p>
            <p className="text-[12px] text-text-primary leading-relaxed">{scene.action}</p>
          </div>
        )}

        {/* The takeaway */}
        {scene.takeaway && (
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-semibold tracking-wider mb-1.5">THE TAKEAWAY</p>
            <p className="text-[13px] font-serif text-text-primary leading-relaxed italic">"{scene.takeaway}"</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-50 sticky bottom-0 bg-white">
        <p className="text-[10px] text-gray-400">
          <span className="font-semibold">Tip:</span> use ← / → arrow keys to navigate scenes
        </p>
      </div>
    </aside>
  )
}
