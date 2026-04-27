/**
 * Aasan Background Service Worker
 * Handles agent actions: read pages, open tabs, extract content.
 * This is where Peraasan's "hands" live.
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const { action, payload } = message;

  switch (action) {
    case "read_page":
      handleReadPage(payload).then(sendResponse);
      return true; // async response

    case "read_current_tab":
      handleReadCurrentTab(sender.tab?.id).then(sendResponse);
      return true;

    case "open_and_read":
      handleOpenAndRead(payload).then(sendResponse);
      return true;

    case "get_open_tabs":
      handleGetOpenTabs().then(sendResponse);
      return true;

    case "search_tabs":
      handleSearchTabs(payload).then(sendResponse);
      return true;

    default:
      sendResponse({ error: `Unknown action: ${action}` });
  }
});

// Read a specific URL — opens tab, extracts content, closes tab
async function handleReadPage(payload) {
  const { url } = payload;
  try {
    // Open the page in a background tab
    const tab = await chrome.tabs.create({ url, active: false });

    // Wait for page to load
    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });

    // Extract text content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const title = document.title;
        const meta = document.querySelector('meta[name="description"]')?.content || "";
        // Get main content, skip nav/footer/sidebar
        const main = document.querySelector("main, article, [role='main'], .content, #content");
        const text = (main || document.body).innerText.substring(0, 8000); // Cap at 8K chars
        return { title, meta, text, url: window.location.href };
      },
    });

    // Close the background tab
    await chrome.tabs.remove(tab.id);

    return { status: "ok", content: results[0]?.result };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}

// Read the currently active tab
async function handleReadCurrentTab(tabId) {
  try {
    if (!tabId) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      tabId = tab.id;
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const title = document.title;
        const meta = document.querySelector('meta[name="description"]')?.content || "";
        const main = document.querySelector("main, article, [role='main'], .content, #content");
        const text = (main || document.body).innerText.substring(0, 8000);
        return { title, meta, text, url: window.location.href };
      },
    });

    return { status: "ok", content: results[0]?.result };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}

// Open a URL, read it, return content (keeps tab open)
async function handleOpenAndRead(payload) {
  const { url } = payload;
  try {
    const tab = await chrome.tabs.create({ url, active: true });

    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (tabId === tab.id && info.status === "complete") {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });

    // Short delay for dynamic content
    await new Promise((r) => setTimeout(r, 1500));

    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const title = document.title;
        const text = document.body.innerText.substring(0, 8000);
        return { title, text, url: window.location.href };
      },
    });

    return { status: "ok", content: results[0]?.result, tabId: tab.id };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}

// Get all open tabs
async function handleGetOpenTabs() {
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    return {
      status: "ok",
      tabs: tabs.map((t) => ({ id: t.id, title: t.title, url: t.url })),
    };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}

// Search open tabs by title/URL keyword
async function handleSearchTabs(payload) {
  const { query } = payload;
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const matches = tabs.filter(
      (t) =>
        t.title?.toLowerCase().includes(query.toLowerCase()) ||
        t.url?.toLowerCase().includes(query.toLowerCase())
    );
    return {
      status: "ok",
      tabs: matches.map((t) => ({ id: t.id, title: t.title, url: t.url })),
    };
  } catch (err) {
    return { status: "error", error: err.message };
  }
}

console.log("[Aasan] Background service worker loaded — Peraasan agent ready.");
