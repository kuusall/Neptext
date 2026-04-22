import { useState, useCallback, useRef, useEffect } from "react";
import Spotlight from "@/components/Spotlight";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Copy, Search, ArrowLeft, SpellCheck, Brain, Download, Type } from "lucide-react";
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

type Mode = "sentiment" | "spell" | "predict";

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

const Index = () => {
  const [text, setText] = useState("");
  const [mode, setMode] = useState<Mode>("sentiment");
  const [loading, setLoading] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const [hasPredictionAttempt, setHasPredictionAttempt] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Results per mode
  const [sentimentResult, setSentimentResult] = useState<{
    sentiment: string;
    label_id: number;
    confidence: number;
    model: string;
  } | null>(null);
  const [spellResult, setSpellResult] = useState<{
    original_text: string;
    corrected_text: string;
    suggestions: { index: number; from: string; suggest: string; edit_distance: number }[];
  } | null>(null);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);

  const clearResults = () => {
    setSentimentResult(null);
    setSpellResult(null);
    setPredictions([]);
    setHasPredictionAttempt(false);
  };

  const handleAnalyze = useCallback(async () => {
    if (!text.trim()) {
      toast("Please paste some Nepali text first.");
      return;
    }
    setLoading(true);
    clearResults();

    try {
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
        case "predict": {
          setHasPredictionAttempt(true);
          const res = await predictText(text, 5);
          setPredictions(normalizePredictions(res.predictions));
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
  }, [text, mode]);

  const copyText = () => {
    navigator.clipboard.writeText(text).then(() => toast("Copied to clipboard"));
  };

  const applyCorrection = (corrected: string) => {
    setText(corrected);
    setSpellResult(null);
    toast.success("Corrections applied!");
  };

  const insertPrediction = async (word: string) => {
    const nextText = text.endsWith(" ") ? `${text}${word}` : `${text} ${word}`;
    setText(nextText);
    textareaRef.current?.focus();

    setLoading(true);
    setHasPredictionAttempt(true);
    try {
      const res = await predictText(nextText, 5);
      setPredictions(normalizePredictions(res.predictions));
      setApiConnected(true);
    } catch (error) {
      setApiConnected(false);
      const message = error instanceof Error ? error.message : "Failed to refresh predictions";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

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

  const hasPredictResult = mode === "predict" && (predictions.length > 0 || hasPredictionAttempt || loading);
  const hasResult = sentimentResult || spellResult || hasPredictResult;

  const modeIcons: Record<Mode, React.ReactNode> = {
    sentiment: <Brain className="h-3.5 w-3.5" />,
    spell: <SpellCheck className="h-3.5 w-3.5" />,
    predict: <Type className="h-3.5 w-3.5" />,
  };

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-[480px]">
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

              {/* Text Input */}
              <Textarea
                ref={textareaRef}
                id="nepali-text"
                placeholder="Type or paste Nepali / Romanized text…"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="rounded-lg p-3 text-sm shadow-none min-h-[100px] resize-none"
              />

              {/* Actions row */}
              <div className="flex items-center justify-between">
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
                </div>

                <Button
                  onClick={handleAnalyze}
                  variant="hero"
                  size="sm"
                  className="rounded-full px-4 gap-1.5"
                  disabled={loading}
                  aria-label="Analyze"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">
                    {mode === "spell" ? "Check" : mode === "predict" ? "Suggest" : "Analyze"}
                  </span>
                </Button>
              </div>

              {/* Results */}
              {hasResult && (
                <section aria-live="polite" className="pt-1">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      {mode === "predict" ? "Predictions" : mode.charAt(0).toUpperCase() + mode.slice(1)} Result
                    </p>
                    <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2" onClick={clearResults}>
                      <ArrowLeft className="h-3 w-3 mr-1" /> Clear
                    </Button>
                  </div>

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
            </CardContent>
          </Card>
        </Spotlight>

        <h1 className="sr-only">NepText — Nepali Language Toolkit</h1>
      </div>
    </main>
  );
};

export default Index;
