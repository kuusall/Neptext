// NepText Content Script
// Extracts selected text from web pages and sends to extension

(() => {
  // Listen for text selection
  document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";

    if (selectedText.length > 0) {
      chrome.storage.local.set({ selectedText: selectedText });
    }
  });

  // Listen for keyboard shortcut (Ctrl+Shift+N)
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === "N") {
      e.preventDefault();
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString().trim() : "";

      if (selectedText.length > 0) {
        chrome.storage.local.set({ selectedText: selectedText });
        // Open popup via background
        chrome.runtime.sendMessage({
          type: "SELECTED_TEXT",
          text: selectedText,
        });
      }
    }
  });
})();
