/**
 * Aasan Bridge — Content Script
 * Runs inside the Aasan tab. Listens for Peraasan agent requests
 * from the React app and forwards them to the background service worker.
 */

// Listen for messages from the Aasan React app
window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.source !== "aasan-peraasan") return;

  const { action, payload, requestId } = event.data;

  try {
    // Forward to background service worker
    const response = await chrome.runtime.sendMessage({
      action,
      payload,
      requestId,
    });

    // Send result back to the React app
    window.postMessage({
      source: "aasan-bridge",
      requestId,
      result: response,
    }, "*");
  } catch (err) {
    window.postMessage({
      source: "aasan-bridge",
      requestId,
      error: err.message,
    }, "*");
  }
});

// Let the React app know the extension is installed
window.postMessage({ source: "aasan-bridge", type: "ready" }, "*");
console.log("[Aasan Bridge] Extension loaded — Peraasan has hands.");
