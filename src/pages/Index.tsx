<<<<<<< HEAD
import { useState, useCallback, useRef, useEffect } from "react";
=======
import { useState, useCallback, useRef, useEffect, KeyboardEvent } from "react";
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
import Spotlight from "@/components/Spotlight";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
<<<<<<< HEAD
import { Copy, Search, ArrowLeft, SpellCheck, Brain, Download, Type } from "lucide-react";
=======
import { Copy, Languages, Search, SpellCheck, Brain, Download, Keyboard, Sparkles } from "lucide-react";
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
import SentimentResultDisplay from "@/components/SentimentResult";
import SpellCheckResultDisplay from "@/components/SpellCheckResult";
import PredictionChips from "@/components/PredictionChips";
import ApiSettings from "@/components/ApiSettings";
import {
  analyzeSentiment,
  checkHealth,
  spellCheck,
  predictText,
} from "@/lib/api";
<<<<<<< HEAD

type Mode = "sentiment" | "spell" | "predict";
=======
import { transliterate } from "@/lib/transliterate";
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1

type PredictionItem = { word: string; probability: number };

function normalizePredictions(items: PredictionItem[]): PredictionItem[] {
  const seen = new Set<string>();
  return items
    .map((item) => ({
      word: item.word.trim(),
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

// Demo predictions keyed by last word pattern
const DEMO_PREDICTIONS: Record<string, string[]> = {
  default: ["छ", "हुन्छ", "गर्छु", "भयो", "थियो"],
  hola: ["कि", "त", "नि", "र", "भने"],
  xa: ["कि", "होला", "त", "नि", "भने"],
  hunuhunxa: ["म", "तपाईं", "हामी", "उनीहरू", "यो"],
  garxu: ["कि", "भने", "म", "तपाईं", "हामी"],
  "": ["नमस्ते", "तपाईंलाई", "म", "यो", "कस्तो"],
};

// Demo spell corrections for Romanized text
const ROMANIZED_CORRECTIONS = [
  { word: "k", suggestion: "के", position: 0 },
  { word: "gardai", suggestion: "गर्दै", position: 2 },
  { word: "hunuhunxa", suggestion: "हुनुहुन्छ", position: 9 },
  { word: "aash", suggestion: "आशा", position: 23 },
  { word: "garxu", suggestion: "गर्छु", position: 28 },
  { word: "hjur", suggestion: "हजुर", position: 34 },
];

// Demo spell corrections for Unicode Nepali text
const UNICODE_CORRECTIONS = [
  { word: "गरदै", suggestion: "गर्दै", position: 0 },
  { word: "हुनुहुनछ", suggestion: "हुनुहुन्छ", position: 5 },
  { word: "गरछु", suggestion: "गर्छु", position: 14 },
  { word: "खबर", suggestion: "ख़बर", position: 23 },
];

function getDemoPredictions(text: string): string[] {
  const words = text.trim().split(/\s+/);
  const lastWord = words[words.length - 1]?.toLowerCase() || "";
  return DEMO_PREDICTIONS[lastWord] || DEMO_PREDICTIONS.default;
}

function isUnicodeNepali(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

function getDemoSpellResult(text: string) {
  const hasUnicode = isUnicodeNepali(text);
  const hasRomanized = /[a-zA-Z]/.test(text);

  const corrections: { word: string; suggestion: string; position: number }[] = [];

  if (hasRomanized) {
    // Check Romanized words
    const words = text.split(/\s+/);
    for (const corr of ROMANIZED_CORRECTIONS) {
      if (words.some((w) => w.toLowerCase() === corr.word.toLowerCase())) {
        corrections.push(corr);
      }
    }
  }

  if (hasUnicode) {
    // Check Unicode Nepali words
    const words = text.split(/\s+/);
    for (const corr of UNICODE_CORRECTIONS) {
      if (words.some((w) => w === corr.word)) {
        corrections.push(corr);
      }
    }
  }

  if (corrections.length === 0 && hasRomanized) {
    // If romanized text, suggest transliteration as correction
    const romanWords = text.split(/\s+/).filter((w) => /^[a-zA-Z]+$/.test(w));
    romanWords.slice(0, 4).forEach((w, i) => {
      const converted = transliterate(w);
      if (converted !== w) {
        corrections.push({ word: w, suggestion: converted, position: i });
      }
    });
  }

  const corrected = hasRomanized && !hasUnicode
    ? "के गर्दै हुनुहुन्छ? म आशा गर्छु हजुर को खबर ठिकै छ होला"
    : text;

  return { original: text, corrected, corrections };
}

const Index = () => {
<<<<<<< HEAD
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("sentiment");
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [hasPredictionAttempt, setHasPredictionAttempt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const predictionRequestSeq = useRef(0);
=======
  const [text, setText] = useState(sampleText);
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [translitEnabled, setTranslitEnabled] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1

  // All results shown simultaneously
  const [sentimentResult, setSentimentResult] = useState<{
    sentiment: string;
    label_id: number;
    confidence: number;
    model: string;
  } | null>(null);
  const [spellResult, setSpellResult] = useState<{
<<<<<<< HEAD
    original_text: string;
    corrected_text: string;
    suggestions: { index: number; from: string; suggest: string; edit_distance: number }[];
  } | null>(null);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);

  const clearResults = useCallback(() => {
    setSentimentResult(null);
    setSpellResult(null);
    setPredictions([]);
    setHasPredictionAttempt(false);
  }, []);

  const fetchPredictions = useCallback(
    async (inputText: string, options?: { silent?: boolean }) => {
      const trimmed = inputText.trim();
      if (!trimmed) {
        predictionRequestSeq.current += 1;
        setPredictions([]);
        setHasPredictionAttempt(false);
        setLoading(false);
        return;
      }

      const requestId = ++predictionRequestSeq.current;
      setLoading(true);
      setHasPredictionAttempt(true);

      try {
        const res = await predictText(trimmed, 5);
        if (requestId !== predictionRequestSeq.current) return;
        setPredictions(normalizePredictions(res.predictions));
        setApiConnected(true);
      } catch (error) {
        if (requestId !== predictionRequestSeq.current) return;
        setApiConnected(false);
        if (!options?.silent) {
          const message = error instanceof Error ? error.message : "Failed to fetch predictions";
          toast.error(message);
        }
      } finally {
        if (requestId === predictionRequestSeq.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const handleAnalyze = useCallback(async () => {
=======
    original: string; corrected: string; corrections: { word: string; suggestion: string; position: number }[];
  } | null>(null);
  const [predictions, setPredictions] = useState<string[]>([]);
  const [predictLoading, setPredictLoading] = useState(false);
  const [spellLoading, setSpellLoading] = useState(false);

  // Live predictions — debounced as user types
  useEffect(() => {
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
    if (!text.trim()) {
      setPredictions([]);
      return;
    }

    setPredictLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await predictText(text);
        setPredictions(res.suggestions);
        setApiConnected(true);
      } catch {
        // Demo fallback
        setPredictions(getDemoPredictions(text));
      }
      setPredictLoading(false);
    }, 400);

    return () => clearTimeout(debounceRef.current);
  }, [text]);

  // Live spell check — debounced
  const spellDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (!text.trim()) {
      setSpellResult(null);
      return;
    }

    setSpellLoading(true);
    clearTimeout(spellDebounceRef.current);
    spellDebounceRef.current = setTimeout(async () => {
      try {
        const res = await spellCheck(text);
        setSpellResult(res);
        setApiConnected(true);
      } catch {
        // Demo fallback — supports both Romanized and Unicode
        const demo = getDemoSpellResult(text);
        if (demo.corrections.length > 0) {
          setSpellResult(demo);
        } else {
          setSpellResult(null);
        }
      }
      setSpellLoading(false);
    }, 600);

    return () => clearTimeout(spellDebounceRef.current);
  }, [text]);

  const handleSentiment = useCallback(async () => {
    if (!text.trim()) {
      toast("Please enter some Nepali text first.");
      return;
    }

    if (mode === "predict") {
      await fetchPredictions(text, { silent: false });
      return;
    }

    setLoading(true);
    setSentimentResult(null);

    try {
<<<<<<< HEAD
      switch (mode) {
        case "sentiment": {
          const res = await analyzeSentiment(text);
          setSentimentResult(res);
          break;
        }
        case "spell": {
          const res = await spellCheck(text, false);
          setSpellResult(res);
          break;
        }
      }
      setApiConnected(true);
    } catch (error) {
      setApiConnected(false);
      const message = error instanceof Error ? error.message : "Failed to fetch analysis from API";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [text, mode, clearResults, fetchPredictions]);
=======
      const res = await analyzeSentiment(text);
      setSentimentResult(res);
      setApiConnected(true);
    } catch {
      setApiConnected(false);
      setSentimentResult({
        label: "बिनम्र सामान्य भाव",
        score: 0.78,
        explanation: "टिप्पणीले मैत्रीपूर्ण स्वर र सामान्य कल्याण लाई ब्यक्त गर्छ।",
      });
      toast.info("Demo mode — connect your API for live results");
    } finally {
      setLoading(false);
    }
  }, [text]);
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1

  const copyText = () => {
    navigator.clipboard.writeText(text).then(() => toast("Copied to clipboard"));
  };

  const applyCorrection = (corrected: string) => {
    setText(corrected);
    setSpellResult(null);
    toast.success("Corrections applied!");
  };

<<<<<<< HEAD
  const insertPrediction = useCallback(async (word: string) => {
    const nextText = text.endsWith(" ") ? `${text}${word}` : `${text} ${word}`;
    setText(nextText);
=======
  const insertPrediction = (word: string) => {
    setText((prev) => (prev.endsWith(" ") ? prev + word : prev + " " + word));
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
    textareaRef.current?.focus();

    await fetchPredictions(nextText, { silent: true });
  }, [text, fetchPredictions]);

  useEffect(() => {
    if (mode !== "predict") return;

    const timer = window.setTimeout(() => {
      void fetchPredictions(text, { silent: true });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [mode, text, fetchPredictions]);

  useEffect(() => {
    if (mode === "predict") return;
    predictionRequestSeq.current += 1;
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (mode !== "predict") return;

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        if (loading || !text.trim()) return;
        event.preventDefault();
        void handleAnalyze();
        return;
      }

      if (!event.altKey || loading || predictions.length === 0) return;

      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index >= Math.min(predictions.length, 9)) return;

      event.preventDefault();
      void insertPrediction(predictions[index].word);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mode, loading, text, predictions, handleAnalyze, insertPrediction]);

  const testConnection = async () => {
    try {
      await checkHealth();
      setApiConnected(true);
      toast.success("Connected to API!");
    } catch {
      setApiConnected(false);
      toast.error("Cannot reach API server");
    }
  };

  const downloadExtension = () => {
    fetch("/neptext-extension.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed: ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "neptext-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => toast.error("Extension package not ready yet"));
  };

<<<<<<< HEAD
  const hasPredictResult = mode === "predict" && (predictions.length > 0 || hasPredictionAttempt || loading);
  const hasResult = sentimentResult || spellResult || hasPredictResult;

  const modeIcons: Record<Mode, React.ReactNode> = {
    sentiment: <Brain className="h-3.5 w-3.5" />,
    spell: <SpellCheck className="h-3.5 w-3.5" />,
    predict: <Type className="h-3.5 w-3.5" />,
  };

=======
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-[520px]">
        <Spotlight className="glass rounded-xl">
          <Card className="glass rounded-xl border-0">
            {/* Header */}
            <CardHeader className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/lovable-uploads/4bf81b54-5fff-444d-80e4-93b52ed0ebcf.png"
                    alt="NepText logo"
                    className="h-7 w-7 rounded-md object-contain"
                    loading="lazy"
                  />
                  <div>
                    <h1 className="text-sm font-semibold tracking-tight leading-none">NepText</h1>
                    <p className="text-[10px] text-muted-foreground mt-0.5">नेपाली भाषा टुलकिट</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <ApiSettings connected={apiConnected} onTest={testConnection} />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={downloadExtension}
                          aria-label="Download extension"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Download Extension</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3 px-4 pb-4 pt-0">
<<<<<<< HEAD
              {/* Mode Tabs */}
              <Tabs value={mode} onValueChange={(v) => { setMode(v as Mode); clearResults(); }}>
                <TabsList className="w-full grid grid-cols-3 h-8">
                  {(["sentiment", "spell", "predict"] as Mode[]).map((m) => (
                    <TabsTrigger key={m} value={m} className="text-[11px] gap-1 px-1">
                      {modeIcons[m]}
                      <span className="hidden sm:inline">{m === "predict" ? "Predict" : m.charAt(0).toUpperCase() + m.slice(1)}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

=======
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
              {/* Text Input */}
              <div className="relative">
                <Textarea
                  ref={textareaRef}
                  id="nepali-text"
                  placeholder={translitEnabled ? "Type Romanized Nepali (e.g. namaste) — converts on Space…" : "Type or paste Nepali / Romanized text…"}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                    if (!translitEnabled) return;
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      const separator = e.key === "Enter" ? "\n" : " ";
                      const val = text;
                      const lastSep = Math.max(val.lastIndexOf(" "), val.lastIndexOf("\n"));
                      const prefix = lastSep >= 0 ? val.substring(0, lastSep + 1) : "";
                      const lastWord = lastSep >= 0 ? val.substring(lastSep + 1) : val;
                      if (lastWord && /^[a-zA-Z]+$/.test(lastWord)) {
                        setText(prefix + transliterate(lastWord) + separator);
                      } else {
                        setText(val + separator);
                      }
                    }
                  }}
                  className="rounded-lg p-3 text-sm shadow-none min-h-[100px] resize-none pr-10"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`absolute top-2 right-2 h-6 w-6 p-0 ${translitEnabled ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => {
                          setTranslitEnabled(!translitEnabled);
                          toast(translitEnabled ? "Transliteration OFF" : "Transliteration ON — type Romanized, press Space to convert");
                        }}
                        aria-label="Toggle transliteration"
                      >
                        <Keyboard className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{translitEnabled ? "Disable" : "Enable"} Romanized → नेपाली</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

<<<<<<< HEAD
              {mode === "predict" && loading && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground animate-pulse">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary/70" />
                  Updating suggestions...
=======
              {/* Live Predictions — always visible */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Next word suggestions</span>
                </div>
                <PredictionChips
                  suggestions={predictions}
                  onSelect={insertPrediction}
                  loading={predictLoading}
                />
              </div>

              {/* Live Spell Check — always visible when errors found */}
              {(spellLoading || spellResult) && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <SpellCheck className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Spell Check {isUnicodeNepali(text) && /[a-zA-Z]/.test(text) ? "(Romanized + Unicode)" : isUnicodeNepali(text) ? "(Unicode)" : "(Romanized)"}
                    </span>
                  </div>
                  {spellLoading ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                      <div className="h-1.5 w-1.5 rounded-full bg-gradient-gold animate-bounce" />
                      Checking spelling…
                    </div>
                  ) : spellResult ? (
                    <SpellCheckResultDisplay
                      original={spellResult.original}
                      corrected={spellResult.corrected}
                      corrections={spellResult.corrections}
                      onApply={applyCorrection}
                    />
                  ) : null}
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
                </div>
              )}

              {/* Actions row */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={copyText}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Copy</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
<<<<<<< HEAD
=======
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => {
                          const converted = transliterate(text);
                          setText(converted);
                          toast.success("Transliterated to Devanagari");
                        }}>
                          <Languages className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Convert all to नेपाली</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
                </div>

                <Button
                  onClick={handleSentiment}
                  variant="hero"
                  size="sm"
                  className="rounded-full px-4 gap-1.5"
                  disabled={loading}
                  aria-label="Analyze Sentiment"
                >
                  <Brain className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">
<<<<<<< HEAD
                    {mode === "spell" ? "Check" : mode === "predict" ? "Refresh" : "Analyze"}
=======
                    {loading ? "Analyzing…" : "Sentiment"}
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
                  </span>
                </Button>
              </div>

              {/* Sentiment Result */}
              {sentimentResult && (
                <section aria-live="polite" className="pt-1">
                  <div className="flex items-center gap-1.5 mb-2">
                    <Brain className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Sentiment Analysis</span>
                  </div>
<<<<<<< HEAD

                  {sentimentResult && (
                    <SentimentResultDisplay
                      sentiment={sentimentResult.sentiment}
                      confidence={sentimentResult.confidence}
                      model={sentimentResult.model}
                    />
                  )}

                  {spellResult && (
                    <SpellCheckResultDisplay
                      originalText={spellResult.original_text}
                      correctedText={spellResult.corrected_text}
                      corrections={spellResult.suggestions}
                      onApply={applyCorrection}
                    />
                  )}

                  {mode === "predict" && (
                    <PredictionChips
                      suggestions={predictions}
                      onSelect={insertPrediction}
                      loading={loading && mode === "predict"}
                      hasQueried={hasPredictionAttempt}
                      onRefresh={text.trim() ? handleAnalyze : undefined}
                    />
                  )}
                </section>
              )}

              {loading && !predictions.length && mode !== "predict" && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
                  <div className="h-1.5 w-1.5 rounded-full bg-gradient-gold animate-bounce" />
                  Analyzing…
                </div>
              )}
=======
                  <SentimentResultDisplay
                    label={sentimentResult.label}
                    score={sentimentResult.score}
                    explanation={sentimentResult.explanation}
                  />
                </section>
              )}
>>>>>>> fc848259d3dd031c643dd9845f762094d6bdcdf1
            </CardContent>
          </Card>
        </Spotlight>

        <h1 className="sr-only">NepText — Nepali Language Toolkit</h1>
      </div>
    </main>
  );
};

export default Index;
