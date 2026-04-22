import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Wifi, WifiOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { getApiBaseUrl } from "@/lib/api";

interface ApiSettingsProps {
  connected: boolean;
  onTest: () => void;
}

export default function ApiSettings({ connected, onTest }: ApiSettingsProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" aria-label="API Settings">
          {connected ? (
            <Wifi className="h-3.5 w-3.5 text-emerald-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-sm">API Configuration</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Connect to your NepText model server
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Endpoint</label>
            <div className="flex items-center gap-2">
              <Input
                value={getApiBaseUrl()}
                readOnly
                className="text-xs font-mono"
              />
              <Badge variant={connected ? "default" : "secondary"} className="shrink-0 text-xs">
                {connected ? "Live" : "Offline"}
              </Badge>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">
              Set <code className="bg-muted px-1 rounded">VITE_NEPTEXT_API_URL</code> env var to change
            </p>
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Expected endpoints:</p>
            <code className="block text-[10px] bg-muted rounded px-2 py-1">GET /health</code>
            <code className="block text-[10px] bg-muted rounded px-2 py-1">POST /sentiment</code>
            <code className="block text-[10px] bg-muted rounded px-2 py-1">POST /spell-correct</code>
            <code className="block text-[10px] bg-muted rounded px-2 py-1">POST /word-predict</code>
            <code className="block text-[10px] bg-muted rounded px-2 py-1">POST /api/sentiment</code>
            <code className="block text-[10px] bg-muted rounded px-2 py-1">POST /api/spell-check</code>
            <code className="block text-[10px] bg-muted rounded px-2 py-1">POST /api/predict</code>
            
          </div>

          <Button size="sm" variant="outline" className="w-full text-xs" onClick={onTest}>
            Test Connection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
