// NepText Popup Logic
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

let mode = "sentiment";
let topPrediction = "";
let spellResults = null;
const input = $("#input");
const resultArea = $("#result-area");
const loading = $("#loading");
const analyzeBtn = $("#analyze-btn");
const btnLabel = $("#btn-label");
const statusEl = $("#status");
const apiUrlInput = $("#api-url");
const ghostText = $("#ghost-text");

const SENTIMENT_BY_LABEL_ID = {
  0: "negative",
  1: "semi_negative",
  2: "neutral",
  3: "semi_positive",
  4: "positive",
};

const LABEL_ID_BY_SENTIMENT = {
  negative: 0,
  semi_negative: 1,
  neutral: 2,
  semi_positive: 3,
  positive: 4,
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizePredictions(items) {
  if (!items || !Array.isArray(items)) return [];
  const seen = new Set();
  return items
    .map((item) => ({
      word: (item.word || "").trim(),
      probability: Math.max(0, Math.min(1, Number(item.probability) || 0)),
    }))
    .filter((item) => item.word.length > 0)
    .sort((a, b) => b.probability - a.probability)
    .filter((item) => {
      if (seen.has(item.word)) return false;
      seen.add(item.word);
      return true;
    });
}

function clearResults() {
  resultArea.innerHTML = "";
  spellResults = null;
}

// Load saved API URL
chrome.storage.local.get(["apiBaseUrl", "selectedText"], (data) => {
  apiUrlInput.value = data.apiBaseUrl || "https://neptext-server-production.up.railway.app";
  if (data.selectedText) {
    input.value = data.selectedText;
    chrome.storage.local.remove("selectedText");
  }
});

// Save API URL on change
apiUrlInput.addEventListener("change", () => {
  chrome.storage.local.set({ apiBaseUrl: apiUrlInput.value.trim() });
});

// Tab switching
$$(".tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    $$(".tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    mode = tab.dataset.mode;
    clearResults();
    updateBtnLabel();
  });
});

function updateBtnLabel() {
  const labels = { sentiment: "Analyze", spell: "Check", predict: "Suggest" };
  btnLabel.textContent = labels[mode] || "Analyze";
}

function updateGhostText() {
  if (!ghostText) return;
  const rawText = input.value;
  let html = "";
  let lastIndex = 0;

  if (spellResults) {
    const suggestions = [...spellResults.suggestions].sort((a, b) => a.index - b.index);
    suggestions.forEach(s => {
      html += escapeHtml(rawText.slice(lastIndex, s.index));
      html += `<span class="spell-error">${escapeHtml(rawText.slice(s.index, s.index + s.from.length))}</span>`;
      lastIndex = s.index + s.from.length;
    });
  }
  html += escapeHtml(rawText.slice(lastIndex));

  const predictionHtml = (mode === "predict" && rawText.endsWith(" ") && topPrediction)
    ? `<span class="prediction">${escapeHtml(topPrediction)}</span>`
    : "";

  ghostText.innerHTML = `${html}${predictionHtml}`;
}

// Copy
$("#copy-btn").addEventListener("click", () => {
  navigator.clipboard.writeText(input.value);
});

function fixSingleError(index, suggest) {
  if (!spellResults) return;
  const error = spellResults.suggestions.find(s => s.index === index);
  if (!error) return;
  const text = input.value;
  const newText = text.slice(0, error.index) + suggest + text.slice(error.index + error.from.length);
  input.value = newText;
  handleSpellCheck();
}

async function handleSpellCheck() {
  const text = input.value.trim();
  if (text.length < 2) {
    spellResults = null;
    updateGhostText();
    return;
  }

  loading.style.display = "flex";
  analyzeBtn.disabled = true;

  chrome.runtime.sendMessage(
    { type: "API_CALL", endpoint: "/spell-correct", body: { text, suggest_only: false } },
    (response) => {
      loading.style.display = "none";
      analyzeBtn.disabled = false;

      if (response && response.success) {
        statusEl.textContent = "Live";
        statusEl.classList.add("live");
        spellResults = response.data;
        renderSpellCheck(response.data);
        updateGhostText();
      } else {
        statusEl.textContent = "Offline";
        statusEl.classList.remove("live");
        renderApiError(response?.error || "Cannot reach API server");
      }
    }
  );
}

async function performAnalysis() {
  const text = input.value.trim();
  if (text.length < 2) {
    if (mode === "predict") {
      topPrediction = "";
      updateGhostText();
    }
    return;
  }

  const endpoints = {
    sentiment: "/sentiment",
    spell: "/spell-correct",
    predict: "/word-predict",
  };

  const bodyByMode = {
    sentiment: { text },
    spell: { text, suggest_only: false },
    predict: { text, top_k: 5 },
  };

  loading.style.display = "flex";
  clearResults();
  analyzeBtn.disabled = true;

  chrome.runtime.sendMessage(
    { type: "API_CALL", endpoint: endpoints[mode], body: bodyByMode[mode] },
    (response) => {
      loading.style.display = "none";
      analyzeBtn.disabled = false;

      if (response && response.success) {
        statusEl.textContent = "Live";
        statusEl.classList.add("live");
        renderResult(response.data);
      } else {
        statusEl.textContent = "Offline";
        statusEl.classList.remove("live");
        renderApiError(response?.error || "Cannot reach API server");
      }
    }
  );
}

// Input event for autocomplete
input.addEventListener("input", () => {
  const val = input.value;
  if (mode === "predict") {
    if (val.endsWith(" ")) {
      performAnalysis();
    } else if (topPrediction) {
      // Clear prediction if user starts typing the word
      topPrediction = "";
    }
  }
  updateGhostText();
});

// Analyze
analyzeBtn.addEventListener("click", performAnalysis);

$("#spell-check-btn").addEventListener("click", handleSpellCheck);

function renderResult(data) {
  switch (mode) {
    case "sentiment":
      renderSentiment(data);
      break;
    case "spell":
      renderSpellCheck(data);
      break;
    case "predict":
      renderPredictions(data);
      break;
  }
}

function renderApiError(message) {
  const safeMessage = escapeHtml(message);
  resultArea.innerHTML = `
    <div class="result">
      <div class="result-header">
        <span class="result-label">API Error</span>
        <button class="clear-btn" onclick="clearResults()">Clear</button>
      </div>
      <p style="font-size:12px;color:var(--red);line-height:1.5">${safeMessage}</p>
    </div>`;
}

function normalizeSentimentPayload(data) {
  const label = typeof data?.sentiment === "string" ? data.sentiment.trim().toLowerCase() : "";
  const labelField = typeof data?.label === "string" ? data.label.trim().toLowerCase() : "";
  const rawLabelId = Number(data?.label_id ?? data?.labelId);

  let labelId = Number.isFinite(rawLabelId) ? rawLabelId : NaN;
  if (!Number.isFinite(labelId) && labelField.startsWith("label_")) {
    const parsed = Number(labelField.replace("label_", ""));
    if (Number.isFinite(parsed)) labelId = parsed;
  }

  let sentiment = label || labelField;
  if (["pos", "positive"].includes(sentiment)) sentiment = "positive";
  if (["semi_positive", "semi-positive"].includes(sentiment)) sentiment = "semi_positive";
  if (["neg", "negative"].includes(sentiment)) sentiment = "negative";
  if (["semi_negative", "semi-negative"].includes(sentiment)) sentiment = "semi_negative";
  if (["neu", "neutral"].includes(sentiment)) sentiment = "neutral";
  if (sentiment.startsWith("label_")) {
    const parsed = Number(sentiment.replace("label_", ""));
    if (Number.isFinite(parsed)) {
      labelId = parsed;
      sentiment = SENTIMENT_BY_LABEL_ID[parsed] || "neutral";
    }
  }

  if (!["negative", "semi_negative", "neutral", "semi_positive", "positive"].includes(sentiment)) {
    sentiment = SENTIMENT_BY_LABEL_ID[labelId] || "neutral";
  }

  if (!Number.isFinite(labelId)) {
    labelId = LABEL_ID_BY_SENTIMENT[sentiment] ?? 2;
  }

  const rawConfidence = Number(data?.confidence ?? data?.score);
  let confidence = Number.isFinite(rawConfidence) ? rawConfidence : 0;
  if (confidence > 1 && confidence <= 100) confidence = confidence / 100;
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    sentiment,
    label_id: Number.isFinite(labelId) ? labelId : LABEL_ID_BY_SENTIMENT[sentiment] ?? 2,
    confidence,
    model: typeof data?.model === "string" && data.model.trim() ? data.model : "n/a",
  };
}

function renderSentiment(data) {
  const normalizedData = normalizeSentimentPayload(data);
  const normalized = normalizedData.sentiment;
  const emojiBySentiment = {
    negative: "😠",
    semi_negative: "🙁",
    neutral: "😐",
    semi_positive: "🙂",
    positive: "😄",
  };
  const emoji = emojiBySentiment[normalized] || "😐";
  resultArea.innerHTML = `
    <div class="result">
      <div class="result-header">
        <span class="result-label">Sentiment</span>
        <button class="clear-btn" onclick="clearResults()">Clear</button>
      </div>
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
        <span style="font-size:18px">${emoji}</span>
        <span class="badge">${normalizedData.sentiment}</span>
        <span style="margin-left:auto;font-size:12px;font-weight:600">${Math.round(normalizedData.confidence * 100)}%</span>
      </div>
      <div class="score-bar"><div class="score-bar-fill" style="width:${normalizedData.confidence * 100}%"></div></div>
      <p style="font-size:11px;color:var(--muted);line-height:1.5">Model: ${normalizedData.model}</p>
    </div>`;
}

function renderSpellCheck(data) {
  const corrections = data.suggestions
    .map((c) => `
      <div class="correction">
        <div style="display:flex; align-items:center; gap:6px;">
          <span class="old">${escapeHtml(c.from)}</span>
          <span class="arrow">→</span>
          <span class="new">${escapeHtml(c.suggest)}</span>
        </div>
        <button class="fix-btn" data-index="${c.index}" data-suggest="${escapeHtml(c.suggest)}" style="padding:2px 6px; font-size:10px; cursor:pointer; background:var(--card); border:1px solid var(--border); border-radius:4px;">Fix</button>
      </div>`).join("");

  resultArea.innerHTML = `
    <div class="result">
      <div class="result-header">
        <span class="result-label">Spell Check</span>
        <button class="clear-btn" onclick="clearResults()">Clear</button>
      </div>
      ${data.suggestions.length === 0
        ? '<p style="color:var(--green);font-size:12px">✅ No errors found!</p>'
        : `${corrections}
           <p style="font-size:11px;color:var(--muted);margin-top:6px">Original: ${escapeHtml(data.original_text)}</p>
           <p style="font-size:12px;padding:6px;border:1px solid var(--border);border-radius:6px;margin-top:6px">${escapeHtml(data.corrected_text)}</p>`
      }
    </div>`;

  resultArea.querySelectorAll(".fix-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      fixSingleError(Number(btn.dataset.index), btn.dataset.suggest);
    });
  });
}

function renderPredictions(data) {
  const normalized = normalizePredictions(data.predictions);
  if (normalized.length > 0) {
    topPrediction = normalized[0].word;
  } else {
    topPrediction = "";
  }
  updateGhostText();

  const chips = normalized
    .map((s) => `<button class="pred-chip" data-word="${s.word}">${s.word} (${Math.round(s.probability * 100)}%)</button>`)
    .join("");

  resultArea.innerHTML = `
    <div class="result">
      <div class="result-header">
        <span class="result-label">Predictions</span>
        <button class="clear-btn" onclick="clearResults()">Clear</button>
      </div>
      <div class="predictions">${chips}</div>
    </div>`;

  resultArea.querySelectorAll(".pred-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const word = chip.dataset.word;
      input.value = input.value.endsWith(" ") ? input.value + word : input.value + " " + word;
      input.focus();
      updateGhostText();
      performAnalysis();
    });
  });
}

// Listen for selected text from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SELECTED_TEXT" && msg.text) {
    input.value = msg.text;
  }
});

window.addEventListener("keydown", (event) => {
  if (mode !== "predict") return;

  if (event.key === "Escape") {
    topPrediction = "";
    updateGhostText();
    return;
  }

  if (event.key === "Tab" && topPrediction) {
    event.preventDefault();
    input.value = input.value.endsWith(" ") ? input.value + topPrediction : input.value + " " + topPrediction;
    topPrediction = "";
    updateGhostText();
    input.focus();
    performAnalysis();
    return;
  }

  if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
    if (loading.style.display === "flex" || !input.value.trim()) return;
    event.preventDefault();
    performAnalysis();
    return;
  }

  if (!event.altKey || loading.style.display === "flex") return;

  const chips = resultArea.querySelectorAll(".pred-chip");
  const index = Number(event.key) - 1;
  if (Number.isInteger(index) && index >= 0 && index < chips.length && index < 9) {
    event.preventDefault();
    chips[index].click();
  }
});
