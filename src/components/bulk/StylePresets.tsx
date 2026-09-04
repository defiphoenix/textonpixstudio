import { Palette, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STYLE_PRESETS } from "@/lib/bulk/presets";
import type { DesignSettings } from "@/lib/bulk/types";
import { cn } from "@/lib/utils";

export function StylePresets({
  activeName,
  onApply,
  savedPresets,
  onApplySaved,
  onSaveCurrent,
}: {
  activeName: string | null;
  onApply: (name: string, settings: Partial<DesignSettings>) => void;
  savedPresets: { id: string; name: string; settings: DesignSettings }[];
  onApplySaved: (settings: DesignSettings, name: string) => void;
  onSaveCurrent: () => void;
}) {
  return (
    <section className="tile-skeu rounded-2xl p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Palette className="size-5 text-primary" /> Style presets
        </h2>
        <Button variant="tile" className="ml-auto h-9 rounded-xl" onClick={onSaveCurrent}>
          <Save /> Save as preset
        </Button>
      </header>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {STYLE_PRESETS.map((p) => (
          <button
            key={p.name}
            onClick={() => onApply(p.name, p.settings)}
            aria-pressed={activeName === p.name}
            className={cn(
              "rounded-xl px-3 py-2 text-left transition-all",
              activeName === p.name ? "well-skeu text-primary" : "tile-skeu hover:brightness-[1.02]",
            )}
          >
            <span className="block text-sm font-semibold">{p.name}</span>
            <span className="block text-xs text-muted-foreground">{p.description}</span>
          </button>
        ))}
      </div>
      {savedPresets.length ? (
        <div className="mt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Your presets
          </p>
          <div className="flex flex-wrap gap-2">
            {savedPresets.map((p) => (
              <button
                key={p.id}
                onClick={() => onApplySaved(p.settings, p.name)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm",
                  activeName === p.name ? "well-skeu text-primary" : "tile-skeu",
                )}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
