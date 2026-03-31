import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles } from "lucide-react";

interface PredictionChipsProps {
  suggestions: Array<{ word: string; probability: number }>;
  onSelect: (suggestion: string) => void;
  loading?: boolean;
  hasQueried?: boolean;
  onRefresh?: () => void;
}

export default function PredictionChips({
  suggestions,
  onSelect,
  loading,
  hasQueried,
  onRefresh,
}: PredictionChipsProps) {
  const seen = new Set<string>();
  const rankedSuggestions = suggestions
    .map((s) => ({
      word: s.word.trim(),
      probability: Math.max(0, Math.min(1, Number(s.probability) || 0)),
    }))
    .filter((s) => s.word.length > 0)
    .sort((a, b) => b.probability - a.probability)
    .filter((s) => {
      if (seen.has(s.word)) return false;
      seen.add(s.word);
      return true;
    });

  if (loading) {
    return (
      <div className="rounded-lg border bg-card/70 p-3 animate-in fade-in duration-200">
        <div className="flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Predicting next words...</span>
        </div>
      </div>
    );
  }

  if (rankedSuggestions.length === 0) {
    return (
      <div className="rounded-lg border bg-card/70 p-3 animate-in fade-in duration-200">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {hasQueried
              ? "No predictions found for this context. Add one more word and try again."
              : "Click Suggest to get next-word predictions from your current text."}
          </p>
          {onRefresh && hasQueried && (
            <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={onRefresh}>
              Retry
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card/70 p-3 space-y-2.5 animate-in fade-in duration-200">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          Next Word Suggestions
          <Badge variant="secondary" className="h-5 rounded-full px-2 text-[10px]">
            {rankedSuggestions.length}
          </Badge>
        </div>
        {onRefresh && (
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-[11px]" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {rankedSuggestions.map((s, index) => {
          const percent = Math.round(s.probability * 100);
          const isTopPick = index === 0;
          const hotkeyNumber = index + 1;
          return (
            <button
              key={`${s.word}-${index}`}
              type="button"
              onClick={() => onSelect(s.word)}
              title={`Insert ${s.word} (Alt+${hotkeyNumber})`}
              className={`w-full rounded-md border p-2 text-left transition-colors ${
                isTopPick
                  ? "border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-background shadow-elevated"
                  : "bg-background/70 hover:bg-accent"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                    isTopPick
                      ? "border-primary/50 bg-primary text-primary-foreground"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {hotkeyNumber}
                </span>
                <span className={`text-sm truncate ${isTopPick ? "font-semibold" : "font-medium"}`}>{s.word}</span>
                {isTopPick && (
                  <Badge variant="default" className="h-5 px-2 text-[10px] uppercase tracking-wide">
                    Top 1
                  </Badge>
                )}
                <span className="ml-auto text-[10px] text-muted-foreground">Alt</span>
                <span className="text-[11px] font-semibold text-muted-foreground">{percent}%</span>
              </div>
              <Progress value={percent} className={`${isTopPick ? "h-2" : "h-1.5"} mt-1.5`} />
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-muted-foreground">Tap a suggestion or use Alt+1..{Math.min(rankedSuggestions.length, 9)} for quick insert. Use Ctrl/Cmd+Enter to refresh.</p>
    </div>
  );
}
