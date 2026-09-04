import { Gauge, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export const MONTHLY_LIMIT = 500;

export function UsageIndicator({ used, limit = MONTHLY_LIMIT }: { used: number; limit?: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const reached = used >= limit;
  return (
    <section className="tile-skeu rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold">
          <Gauge className="size-4 text-primary" /> Monthly usage
        </h2>
        <span className="well-skeu rounded-full px-3 py-1 text-xs font-semibold">
          {used} / {limit} images
        </span>
      </div>
      <Progress value={pct} className="mt-3" />
      {reached ? (
        <div className="well-skeu mt-3 rounded-xl p-3">
          <p className="text-sm font-semibold">You've reached this month's limit</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upgrade to keep creating unlimited bulk graphics.
          </p>
          <Button variant="hero" className="mt-3 h-9">
            <Sparkles /> Upgrade plan
          </Button>
        </div>
      ) : null}
    </section>
  );
}
