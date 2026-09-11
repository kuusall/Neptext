// NepText Content Script
// Injects a floating logo on selection and an in-page analysis panel

(() => {
  let floatingLogo = null;
  let analysisPanel = null;
  let shadowRoot = null;

  const STYLES = `
    .neptext-logo {
      position: absolute;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      z-index: 2147483647;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: transform 0.2s ease;
      border: 2px solid white;
    }
    .neptext-logo:hover { transform: scale(1.1); }

    .neptext-panel {
      position: absolute;
      width: 350px;
      min-height: 400px;
      background: #fafafa;
      color: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 2147483647;
      border: 1px solid #e5e5e5;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    @media (prefers-color-scheme: dark) {
      .neptext-panel {
        background: #0a0a0a;
        color: #fafafa;
        border-color: #262626;
      }
    }

    .np-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; border-bottom: 1px solid #e5e5e5;
    }
    @media (prefers-color-scheme: dark) { .np-header { border-color: #262626; } }

    .np-header-left { display: flex; align-items: center; gap: 8px; }
    .np-header-left img { width: 24px; height: 24px; border-radius: 4px; }
    .np-header-left h1 { font-size: 14px; font-weight: 600; margin: 0; }
    .np-header-left span { font-size: 9px; color: #737373; display: block; }
    .np-close { cursor: pointer; background: none; border: none; color: #737373; font-size: 16px; }

    .np-tabs {
      display: grid; grid-template-columns: repeat(3, 1fr);
      gap: 4px; padding: 10px 14px 0;
    }
    .np-tab {
      padding: 6px 4px; font-size: 11px; font-weight: 500;
      border: none; background: transparent; color: #737373;
      cursor: pointer; border-radius: 6px; transition: all 0.15s;
    }
    .np-tab.active { background: #0a0a0a; color: #fafafa; }
    @media (prefers-color-scheme: dark) { .np-tab.active { background: #fafafa; color: #0a0a0a; } }

    .np-content { padding: 10px 14px 14px; }
    .np-textarea-wrapper { position: relative; width: 100%; }
    .np-ghost-text {
      position: absolute; top: 1px; left: 1px; right: 1px; bottom: 1px;
      padding: 10px; font-size: 13px; line-height: inherit;
      color: transparent; pointer-events: none; white-space: pre-wrap; word-wrap: break-word; z-index: 0;
    }
    .np-ghost-text .prediction { color: #737373; opacity: 0.5; }
    .np-ghost-text .spell-error { border-bottom: 2px wavy red; }

    .np-textarea {
      width: 100%; min-height: 90px; padding: 10px;
      border: 1px solid #e5e5e5; border-radius: 8px;
      background: transparent; color: inherit; font-size: 13px;
      resize: vertical; outline: none; position: relative; z-index: 1;
    }
    @media (prefers-color-scheme: dark) { .np-textarea { border-color: #262626; } }

    .np-actions { display: flex; align-items: center; justify-content: space-between; margin-top: 8px; }
    .np-actions-left { display: flex; gap: 6px; }
    .np-icon-btn {
      width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;
      background: transparent; border: 1px solid #e5e5e5; border-radius: 6px;
      cursor: pointer; color: #737373; font-size: 14px;
    }
    @media (prefers-color-scheme: dark) { .np-icon-btn { border-color: #262626; } }

    .np-analyze-btn {
      padding: 6px 16px; border: none; border-radius: 99px;
      background: linear-gradient(135deg, #eab308, #fde68a);
      color: #1a1a1a; font-weight: 600; font-size: 12px; cursor: pointer;
      display: flex; align-items: center; gap: 4px;
    }

    .np-result {
      margin-top: 10px; padding: 10px; border: 1px solid #e5e5e5;
      border-radius: 8px; background: transparent;
    }
    @media (prefers-color-scheme: dark) { .np-result { border-color: #262626; } }
    .np-result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
    .np-result-label { font-size: 10px; text-transform: uppercase; color: #737373; font-weight: 500; }
    .np-clear-btn { font-size: 10px; background: none; border: none; color: #737373; cursor: pointer; text-decoration: underline; }

    .np-correction {
      display: flex; align-items: center; justify-content: space-between;
      gap: 6px; padding: 4px 8px; font-size: 12px; border-radius: 6px;
      border: 1px solid #e5e5e5; margin-bottom: 4px;
    }
    @media (prefers-color-scheme: dark) { .np-correction { border-color: #262626; } }
    .np-correction .old { text-decoration: line-through; color: #ef4444; }
    .np-correction .new { color: #22c55e; font-weight: 500; }
    .np-fix-btn { padding: 2px 6px; font-size: 10px; cursor: pointer; background: transparent; border: 1px solid #e5e5e5; border-radius: 4px; color: inherit; }

    .np-predictions { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
    .np-pred-chip {
      padding: 3px 10px; border: 1px solid #e5e5e5; border-radius: 99px;
      font-size: 11px; background: transparent; cursor: pointer; color: inherit;
    }
    .np-loading { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #737373; margin-top: 8px; }
    .np-dot { width: 5px; height: 5px; border-radius: 50%; background: #eab308; animation: np-bounce 0.6s infinite alternate; }
    @keyframes np-bounce { to { transform: translateY(-4px); } }
  `;

  let currentMode = "sentiment";
  let topPrediction = "";
  let spellResults = null;

  function createPanel() {
    const container = document.createElement("div");
    container.id = "neptext-ui-container";
    document.body.appendChild(container);
    shadowRoot = container.attachShadow({ mode: "open" });

    const styleTag = document.createElement("style");
    styleTag.textContent = STYLES;
    shadowRoot.appendChild(styleTag);

    const panel = document.createElement("div");
    panel.className = "np-panel";
    panel.innerHTML = `
      <div class="np-header">
        <div class="np-header-left">
          <img src="${chrome.runtime.getURL("icon.png")}" alt="NepText" />
          <div>
            <h1>NepText</h1>
            <span>नेपाली भाषा टुलकिट</span>
          </div>
        </div>
        <button class="np-close">&times;</button>
      </div>
      <div class="np-tabs">
        <button class="np-tab active" data-mode="sentiment">🧠 Sentiment</button>
        <button class="np-tab" data-mode="spell">✏️ Spell</button>
        <button class="np-tab" data-mode="predict">💡 Predict</button>
      </div>
      <div class="np-content">
        <div class="np-textarea-wrapper">
          <div id="np-ghost-text" class="np-ghost-text"></div>
          <textarea id="np-input" class="np-textarea" placeholder="Type or paste Nepali / Romanized text…"></textarea>
        </div>
        <div class="np-actions">
          <div class="np-actions-left">
            <button class="np-icon-btn" id="np-copy-btn" title="Copy">📋</button>
            <button class="np-icon-btn" id="np-spell-btn" title="Spell Check">✏️</button>
          </div>
          <button class="np-analyze-btn" id="np-analyze-btn">🔍 <span id="np-btn-label">Analyze</span></button>
        </div>
        <div id="np-result-area"></div>
        <div id="np-loading" class="np-loading" style="display:none"><span class="np-dot"></span> Analyzing…</div>
      </div>
    `;
    shadowRoot.appendChild(panel);
    analysisPanel = panel;
    setupPanelListeners();
  }

  function setupPanelListeners() {
    const input = shadowRoot.getElementById("np-input");
    const analyzeBtn = shadowRoot.getElementById("np-analyze-btn");
    const spellBtn = shadowRoot.getElementById("np-spell-btn");
    const copyBtn = shadowRoot.getElementById("np-copy-btn");
    const closeBtn = shadowRoot.querySelector(".np-close");
    const ghostText = shadowRoot.getElementById("np-ghost-text");

    const updateBtnLabel = () => {
      const labels = { sentiment: "Analyze", spell: "Check", predict: "Suggest" };
      shadowRoot.getElementById("np-btn-label").textContent = labels[currentMode] || "Analyze";
    };

    const updateGhostText = () => {
      const text = input.value;
      let html = "";
      let lastIndex = 0;
      if (spellResults) {
        const suggestions = [...spellResults.suggestions].sort((a, b) => a.index - b.index);
        suggestions.forEach(s => {
          html += text.slice(lastIndex, s.index);
          html += `<span class="spell-error">${text.slice(s.index, s.index + s.from.length)}</span>`;
          lastIndex = s.index + s.from.length;
        });
      }
      html += text.slice(lastIndex);
      const predictionHtml = (currentMode === "predict" && text.endsWith(" ") && topPrediction)
        ? `<span class="prediction">${topPrediction}</span>` : "";
      ghostText.innerHTML = html + predictionHtml;
    };

    async function callApi(endpoint, body) {
      shadowRoot.getElementById("np-loading").style.display = "flex";
      analyzeBtn.disabled = true;
      return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: "API_CALL", endpoint, body }, (response) => {
          shadowRoot.getElementById("np-loading").style.display = "none";
          analyzeBtn.disabled = false;
          resolve(response);
        });
      });
    }

    async function performAnalysis() {
      const text = input.value.trim();
      if (text.length < 2) return;

      const endpoints = { sentiment: "/sentiment", spell: "/spell-correct", predict: "/word-predict" };
      const bodies = { sentiment: { text }, spell: { text, suggest_only: false }, predict: { text, top_k: 5 } };

      const response = await callApi(endpoints[currentMode], bodies[currentMode]);
      if (response && response.success) {
        renderResult(response.data);
      } else {
        shadowRoot.getElementById("np-result-area").innerHTML = `<div class="np-result" style="color:red">Error: ${response?.error || "API Failure"}</div>`;
      }
    }

    function renderResult(data) {
      const resultArea = shadowRoot.getElementById("np-result-area");
      resultArea.innerHTML = "";

      if (currentMode === "sentiment") {
        const s = data.sentiment || "neutral";
        resultArea.innerHTML = `<div class="np-result"><strong>Sentiment:</strong> ${s} (${Math.round((data.confidence || 0)*100)}%)</div>`;
      } else if (currentMode === "spell") {
        spellResults = data;
        const corrections = data.suggestions.map(c => `
          <div class="np-correction">
            <span><span class="old">${c.from}</span> → <span class="new">${c.suggest}</span></span>
            <button class="np-fix-btn" data-idx="${c.index}" data-sug="${c.suggest}">Fix</button>
          </div>`).join("");
        resultArea.innerHTML = `<div class="np-result"><div class="np-result-header"><span class="np-result-label">Spell Check</span></div>${corrections || "No errors found!"}</div>`;
        resultArea.querySelectorAll(".np-fix-btn").forEach(btn => {
          btn.onclick = () => {
            const idx = Number(btn.dataset.idx);
            const sug = btn.dataset.sug;
            const t = input.value;
            const err = spellResults.suggestions.find(s => s.index === idx);
            input.value = t.slice(0, err.index) + sug + t.slice(err.index + err.from.length);
            performAnalysis();
            updateGhostText();
          };
        });
        updateGhostText();
      } else if (currentMode === "predict") {
        const normalized = (data.predictions || []).sort((a,b) => b.probability - a.probability);
        topPrediction = normalized[0]?.word || "";
        const chips = normalized.map(s => `<button class="np-pred-chip" data-w="${s.word}">${s.word}</button>`).join("");
        resultArea.innerHTML = `<div class="np-result"><div class="np-result-header"><span class="np-result-label">Predictions</span></div><div class="np-predictions">${chips}</div></div>`;
        resultArea.querySelectorAll(".np-pred-chip").forEach(chip => {
          chip.onclick = () => {
            input.value = input.value.endsWith(" ") ? input.value + chip.dataset.w : input.value + " " + chip.dataset.w;
            input.focus();
            updateGhostText();
            performAnalysis();
          };
        });
        updateGhostText();
      }
    }

    shadowRoot.querySelectorAll(".np-tab").forEach(tab => {
      tab.onclick = () => {
        shadowRoot.querySelectorAll(".np-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        currentMode = tab.dataset.mode;
        updateBtnLabel();
        shadowRoot.getElementById("np-result-area").innerHTML = "";
        spellResults = null;
        updateGhostText();
      };
    });

    input.oninput = () => {
      if (currentMode === "predict" && input.value.endsWith(" ")) performAnalysis();
      updateGhostText();
    };

    analyzeBtn.onclick = performAnalysis;
    spellBtn.onclick = () => { currentMode = "spell"; updateBtnLabel(); performAnalysis(); };
    copyBtn.onclick = () => navigator.clipboard.writeText(input.value);
    closeBtn.onclick = () => {
      analysisPanel.style.display = "none";
      floatingLogo.style.display = "none";
    };
  }

  document.addEventListener("mouseup", () => {
    const selection = window.getSelection();
    const selectedText = selection ? selection.toString().trim() : "";

    if (selectedText.length > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (!floatingLogo) {
        floatingLogo = document.createElement("img");
        floatingLogo.src = chrome.runtime.getURL("icon.png");
        floatingLogo.className = "neptext-logo";
        document.body.appendChild(floatingLogo);

        floatingLogo.onclick = () => {
          if (!analysisPanel) createPanel();
          analysisPanel.style.display = "flex";
          analysisPanel.style.left = `${rect.left}px`;
          analysisPanel.style.top = `${rect.bottom + window.scrollY}px`;

          const input = shadowRoot.getElementById("np-input");
          input.value = selectedText;
          input.focus();

          // Start analysis immediately
          const analyzeBtn = shadowRoot.getElementById("np-analyze-btn");
          if (analyzeBtn) analyzeBtn.click();

          floatingLogo.style.display = "none";
        };
      }

      floatingLogo.style.display = "block";
      floatingLogo.style.left = `${rect.right + window.scrollX}px`;
      floatingLogo.style.top = `${rect.top + window.scrollY}px`;
    } else {
      if (floatingLogo) floatingLogo.style.display = "none";
    }
  });
})();
