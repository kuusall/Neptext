import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface SentimentResultProps {
  sentiment: string;
  confidence: number;
  model: string;
}

const sentimentColor = (confidence: number) => {
  if (confidence >= 0.7) return "text-emerald-500";
  if (confidence >= 0.4) return "text-amber-500";
  return "text-red-400";
};

const sentimentEmoji = (sentiment: string) => {
  const normalized = sentiment.toLowerCase();
  if (normalized === "positive") return "😄";
  if (normalized === "semi_positive") return "🙂";
  if (normalized === "neutral") return "😐";
  if (normalized === "semi_negative") return "🙁";
  if (normalized === "negative") return "😠";
  return "😐";
};

export default function SentimentResultDisplay({ sentiment, confidence, model }: SentimentResultProps) {
  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <span className="text-xl">{sentimentEmoji(sentiment)}</span>
        <Badge className="text-sm px-3 py-1 rounded-full" variant="secondary">
          {sentiment}
        </Badge>
        <span className={`text-sm font-semibold ml-auto ${sentimentColor(confidence)}`}>
          {Math.round(confidence * 100)}%
        </span>
      </div>
      <Progress value={confidence * 100} className="h-1.5" />
      <p className="text-xs text-muted-foreground break-all">Model: {model}</p>
    </div>
  );
}
