// NepText Background Service Worker
// Handles context menu and communication between content script and popup

chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for selected text
  chrome.contextMenus.create({
    id: "neptext-analyze",
    title: "Analyze with NepText",
    contexts: ["selection"],
  });

  // Set default API URL
  chrome.storage.local.get("apiBaseUrl", (data) => {
    if (!data.apiBaseUrl) {
      chrome.storage.local.set({ apiBaseUrl: "http://127.0.0.1:8000" });
    }
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "neptext-analyze" && info.selectionText) {
    // Store the selected text and open popup
    chrome.storage.local.set({ selectedText: info.selectionText }, () => {
      // Send message to popup if it's open
      chrome.runtime.sendMessage({
        type: "SELECTED_TEXT",
        text: info.selectionText,
      }).catch(() => {
        // Popup not open, text is stored for when it opens
      });
    });
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "GET_SELECTED_TEXT") {
    chrome.storage.local.get("selectedText", (data) => {
      sendResponse({ text: data.selectedText || "" });
      // Clear after reading
      chrome.storage.local.remove("selectedText");
    });
    return true; // async response
  }

  if (message.type === "API_CALL") {
    chrome.storage.local.get("apiBaseUrl", async (data) => {
      const baseUrl = data.apiBaseUrl || "http://127.0.0.1:8000";
      try {
        const res = await fetch(`${baseUrl}${message.endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(message.body),
        });
        const result = await res.json();
        if (!res.ok) {
          sendResponse({ success: false, error: result?.detail || `HTTP ${res.status}` });
          return;
        }
        sendResponse({ success: true, data: result });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    });
    return true; // async response
  }
});
