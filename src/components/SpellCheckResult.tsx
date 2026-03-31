import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, AlertTriangle } from "lucide-react";

interface Correction {
  index: number;
  from: string;
  suggest: string;
  edit_distance: number;
}

interface SpellCheckResultProps {
  originalText: string;
  correctedText: string;
  corrections: Correction[];
  onApply: (corrected: string) => void;
}

export default function SpellCheckResultDisplay({
  originalText,
  correctedText,
  corrections,
  onApply,
}: SpellCheckResultProps) {
  if (corrections.length === 0) {
    return (
      <div className="flex items-center gap-2 text-emerald-500 animate-in fade-in duration-300">
        <Check className="h-4 w-4" />
        <span className="text-sm font-medium">No spelling errors found!</span>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500" />
        <span className="text-sm text-muted-foreground">
          {corrections.length} correction{corrections.length > 1 ? "s" : ""} found
        </span>
      </div>

      <div className="space-y-2">
        {corrections.map((c, i) => (
          <div
            key={i}
            className="flex items-center gap-2 text-sm rounded-lg border px-3 py-2 bg-card"
          >
            <span className="line-through text-red-400">{c.from}</span>
            <span className="text-muted-foreground">→</span>
            <span className="font-medium text-emerald-500">{c.suggest}</span>
          </div>
        ))}
      </div>

      <div className="rounded-lg border p-3 bg-card">
        <p className="text-xs text-muted-foreground mb-1">Original: {originalText}</p>
        <p className="text-sm leading-relaxed">{correctedText}</p>
      </div>

      <Button
        variant="hero"
        size="sm"
        className="w-full rounded-full"
        onClick={() => onApply(correctedText)}
      >
        Apply Corrections
      </Button>
    </div>
  );
}
