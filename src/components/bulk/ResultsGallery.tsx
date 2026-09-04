import { useState } from "react";
import { Download, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { FailedImage, GeneratedImage } from "@/lib/bulk/types";

export function ResultsGallery({
  results,
  failed,
  onDelete,
  onRegenerate,
  onRetryFailed,
  onDownloadZip,
  onDownloadSelected,
  zipping,
}: {
  results: GeneratedImage[];
  failed: FailedImage[];
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  onRetryFailed: () => void;
  onDownloadZip: (ids?: string[]) => void;
  onDownloadSelected: (ids: string[]) => void;
  zipping: boolean;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <section className="tile-skeu rounded-2xl p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="text-lg font-bold">Your Images Are Ready</h2>
          <p className="text-sm text-muted-foreground">
            {results.length} completed
            {failed.length ? ` • ${failed.length} failed` : ""}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          {failed.length ? (
            <Button variant="tile" className="h-10 rounded-xl" onClick={onRetryFailed}>
              <RefreshCw /> Retry failed
            </Button>
          ) : null}
          {selected.length ? (
            <Button
              variant="tile"
              className="h-10 rounded-xl"
              onClick={() => onDownloadSelected(selected)}
              disabled={zipping}
            >
              <Download /> Download selected ({selected.length})
            </Button>
          ) : null}
          <Button variant="hero" onClick={() => onDownloadZip()} disabled={zipping || !results.length}>
            <Download /> {zipping ? "Zipping…" : "Download all as ZIP"}
          </Button>
        </div>
      </header>

      {failed.length ? (
        <ul className="well-skeu mb-4 space-y-1 rounded-xl p-3 text-sm text-muted-foreground">
          {failed.slice(0, 5).map((f) => (
            <li key={f.id}>
              <span className="font-medium text-destructive">{f.name}</span> — {f.reason}
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {results.map((r) => (
          <li key={r.id} className="well-skeu group relative rounded-xl p-1.5">
            <img
              src={r.url}
              alt={r.text}
              loading="lazy"
              className="aspect-square w-full rounded-lg object-cover"
            />
            <p className="mt-1.5 line-clamp-2 px-1 text-xs text-muted-foreground">{r.text}</p>
            <div className="absolute left-2 top-2">
              <Checkbox
                aria-label={`Select ${r.name}`}
                checked={selected.includes(r.id)}
                onCheckedChange={() => toggle(r.id)}
                className="bg-background"
              />
            </div>
            <div className="mt-2 flex gap-1 px-1 pb-1">
              <a
                href={r.url}
                download={r.name}
                aria-label={`Download ${r.name}`}
                title="Download"
                className="tile-skeu grid h-8 flex-1 place-items-center rounded-lg"
              >
                <Download className="size-3.5" />
              </a>
              <button
                aria-label={`Regenerate ${r.name}`}
                title="Regenerate with current style"
                onClick={() => onRegenerate(r.id)}
                className="tile-skeu grid size-8 place-items-center rounded-lg"
              >
                <RefreshCw className="size-3.5" />
              </button>
              <button
                aria-label={`Delete ${r.name}`}
                title="Delete"
                onClick={() => {
                  setSelected((s) => s.filter((x) => x !== r.id));
                  onDelete(r.id);
                }}
                className="tile-skeu grid size-8 place-items-center rounded-lg text-destructive"
              >
                <Trash2 className="size-3.5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
