import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { FailedImage, GeneratedImage } from "@/lib/bulk/types";

export function GenerationProgress({
  total,
  done,
  failed,
  results,
}: {
  total: number;
  done: number;
  failed: FailedImage[];
  results: GeneratedImage[];
}) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <section className="tile-skeu rounded-2xl p-4 sm:p-5">
      <h2 className="text-lg font-bold">Generating your images…</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {done} / {total} completed
      </p>
      <Progress value={pct} className="mt-3" />
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-primary">
          <CheckCircle2 className="size-4" /> {results.length} completed
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> {Math.max(0, total - done)} remaining
        </span>
        <span className="flex items-center gap-1.5 text-destructive">
          <XCircle className="size-4" /> {failed.length} failed
        </span>
      </div>
      {results.length ? (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-8">
          {results.slice(-16).map((r) => (
            <li key={r.id} className="well-skeu rounded-lg p-1">
              <img src={r.url} alt={r.text} loading="lazy" className="aspect-square w-full rounded object-cover" />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
