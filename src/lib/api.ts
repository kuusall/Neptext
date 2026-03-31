/**
 * NepText API Service
 * Endpoint contracts are aligned with curl.md documentation.
 */

const API_BASE_URL = import.meta.env.VITE_NEPTEXT_API_URL || "http://127.0.0.1:8000";

export interface HealthResponse {
  status: string;
  message: string;
}

export interface SentimentResult {
  sentiment: string;
  label_id: number;
  confidence: number;
  model: string;
}

export interface SpellCheckResult {
  original_text: string;
  corrected_text: string;
  suggestions: Array<{
    index: number;
    from: string;
    suggest: string;
    edit_distance: number;
  }>;
}

export interface PredictionResult {
  context: string;
  predictions: Array<{
    word: string;
    probability: number;
  }>;
}

<<<<<<< HEAD
const SENTIMENT_BY_LABEL_ID: Record<number, string> = {
  0: "negative",
  1: "semi_negative",
  2: "neutral",
  3: "semi_positive",
  4: "positive",
};

const LABEL_ID_BY_SENTIMENT: Record<string, number> = {
  negative: 0,
  semi_negative: 1,
  neutral: 2,
  semi_positive: 3,
  positive: 4,
};

const SENTIMENT_ALIASES: Record<string, string> = {
  neg: "negative",
  negative: "negative",
  semi_negative: "semi_negative",
  "semi-negative": "semi_negative",
  neu: "neutral",
  neutral: "neutral",
  semi_positive: "semi_positive",
  "semi-positive": "semi_positive",
  pos: "positive",
  positive: "positive",
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
=======
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1

function normalizeConfidence(raw: unknown): number {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return 0;
  if (parsed > 1 && parsed <= 100) return clamp01(parsed / 100);
  return clamp01(parsed);
}

function normalizeSentimentLabel(rawLabel: unknown, rawLabelId: unknown): { sentiment: string; labelId: number } {
  let labelId = Number(rawLabelId);
  if (!Number.isFinite(labelId)) labelId = 2;

  const label = typeof rawLabel === "string" ? rawLabel.trim().toLowerCase() : "";
  const mappedFromLabel = SENTIMENT_ALIASES[label];

  if (mappedFromLabel) {
    const inferredId = LABEL_ID_BY_SENTIMENT[mappedFromLabel] ?? 2;
    return { sentiment: mappedFromLabel, labelId: Number.isFinite(labelId) ? labelId : inferredId };
  }

  if (label.startsWith("label_")) {
    const extractedId = Number(label.replace("label_", ""));
    if (Number.isFinite(extractedId)) {
      return {
        sentiment: SENTIMENT_BY_LABEL_ID[extractedId] || "neutral",
        labelId: extractedId,
      };
    }
  }

  return {
    sentiment: SENTIMENT_BY_LABEL_ID[labelId] || "neutral",
    labelId,
  };
}

function normalizeSentimentResponse(raw: any): SentimentResult {
  const labelIdFromLabel =
    typeof raw?.label === "string" && raw.label.toLowerCase().startsWith("label_")
      ? Number(raw.label.toLowerCase().replace("label_", ""))
      : undefined;

  const label = raw?.sentiment ?? raw?.label ?? raw?.sentiment_label;
  const labelId = raw?.label_id ?? raw?.labelId ?? labelIdFromLabel;
  const normalized = normalizeSentimentLabel(label, labelId);

  const confidence = normalizeConfidence(raw?.confidence ?? raw?.score);
  const model = typeof raw?.model === "string" && raw.model.trim() ? raw.model : "n/a";

  return {
    sentiment: normalized.sentiment,
    label_id: normalized.labelId,
    confidence,
    model,
  };
}

async function apiPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error (${res.status}): ${err}`);
  }

  return res.json();
}

async function apiGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${endpoint}`);

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API Error (${res.status}): ${err}`);
  }

  return res.json();
}

export async function checkHealth(): Promise<HealthResponse> {
  return apiGet<HealthResponse>("/health");
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  const raw = await apiPost<any>("/sentiment", { text });
  return normalizeSentimentResponse(raw);
}

export async function spellCheck(text: string, suggestOnly = false): Promise<SpellCheckResult> {
  return apiPost<SpellCheckResult>("/spell-correct", { text, suggest_only: suggestOnly });
}

<<<<<<< HEAD
export async function predictText(text: string, topK = 5): Promise<PredictionResult> {
  return apiPost<PredictionResult>("/word-predict", { text, top_k: topK });
}
=======
export async function predictText(text: string, cursorPosition?: number): Promise<PredictionResult> {
  return apiCall<PredictionResult>("/api/predict", { text, cursor_position: cursorPosition });
}

>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1

export function getApiBaseUrl(): string {
  console.log("API Base URL:", API_BASE_URL);
  return API_BASE_URL;
}
