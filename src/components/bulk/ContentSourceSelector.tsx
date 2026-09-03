import { useState } from "react";
import { FileText, Loader2, Sparkles, Type, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TextList } from "@/components/bulk/TextList";
import type { Distribution, TextItem } from "@/lib/bulk/types";
import { cn } from "@/lib/utils";

export type ContentMode = "file" | "ai" | "manual";

const DISTRIBUTIONS: { value: Distribution; label: string; help: string }[] = [
  { value: "sequential", label: "Sequential", help: "Text 1 → Image 1, Text 2 → Image 2…" },
  { value: "random", label: "Random", help: "Randomly distribute the available text." },
  { value: "repeat", label: "Repeat", help: "Loop the text list when there are more images." },
  { value: "generate", label: "Generate missing", help: "Use AI to write any missing lines." },
];

function parseCsv(raw: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < raw.length; i += 1) {
    const ch = raw[i]!;
    if (quoted) {
      if (ch === '"' && raw[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (ch === '"') quoted = false;
      else cell += ch;
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (ch !== "\r") cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim()));
}

export function ContentSourceSelector({
  mode,
  onModeChange,
  items,
  onItemsChange,
  prompt,
  onPromptChange,
  count,
  onCountChange,
  distribution,
  onDistributionChange,
  imageCount,
  onGenerate,
  onRegenerateOne,
  generating,
}: {
  mode: ContentMode;
  onModeChange: (m: ContentMode) => void;
  items: TextItem[];
  onItemsChange: (next: TextItem[]) => void;
  prompt: string;
  onPromptChange: (p: string) => void;
  count: number;
  onCountChange: (n: number) => void;
  distribution: Distribution;
  onDistributionChange: (d: Distribution) => void;
  imageCount: number;
  onGenerate: () => void;
  onRegenerateOne: (id: string) => void;
  generating: boolean;
}) {
  const [csvRows, setCsvRows] = useState<string[][] | null>(null);
  const [manual, setManual] = useState("");

  const toItems = (lines: string[]) =>
    onItemsChange(lines.map((text) => ({ id: crypto.randomUUID(), text })));

  const readFile = async (file?: File | null) => {
    if (!file) return;
    const raw = await file.text();
    if (file.name.toLowerCase().endsWith(".csv")) {
      const rows = parseCsv(raw);
      if (!rows.length) {
        toast.error("That CSV looked empty.");
        return;
      }
      setCsvRows(rows);
      const header = rows[0]!;
      const guess = header.findIndex((h) => /quote|text|caption|content|line/i.test(h));
      pickColumn(rows, guess >= 0 ? guess : header.length > 1 ? 1 : 0);
      return;
    }
    setCsvRows(null);
    const lines = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (!lines.length) {
      toast.error("That text file had no usable lines.");
      return;
    }
    toItems(lines);
    toast.success(`${lines.length} text items loaded`);
  };

  const pickColumn = (rows: string[][], index: number) => {
    const header = rows[0]!;
    const hasHeader = !/^[a-z0-9]+\.(jpg|jpeg|png|webp)$/i.test(header[0] ?? "");
    const body = hasHeader ? rows.slice(1) : rows;
    const lines = body.map((r) => (r[index] ?? "").trim()).filter(Boolean);
    if (!lines.length) {
      toast.error("That column has no text.");
      return;
    }
    toItems(lines);
    toast.success(`${lines.length} text items loaded from CSV`);
  };

  return (
    <section className="tile-skeu rounded-2xl p-4 sm:p-5">
      <header className="mb-4">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Sparkles className="size-5 text-primary" /> Text Content
        </h2>
        <p className="text-sm text-muted-foreground">
          Bring your own lines, let AI write them, or type them in.
        </p>
      </header>

      <div className="mb-4 grid gap-2 sm:grid-cols-3">
        {(
          [
            { value: "file", label: "Upload file", icon: FileText },
            { value: "ai", label: "Generate with AI", icon: Wand2 },
            { value: "manual", label: "Enter manually", icon: Type },
          ] as const
        ).map((m) => (
          <button
            key={m.value}
            onClick={() => onModeChange(m.value)}
            aria-pressed={mode === m.value}
            className={cn(
              "flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all",
              mode === m.value ? "well-skeu text-primary" : "tile-skeu hover:brightness-[1.02]",
            )}
          >
            <m.icon className="size-4" /> {m.label}
          </button>
        ))}
      </div>

      {mode === "file" ? (
        <div className="well-skeu space-y-3 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            TXT — one line per text item. CSV — pick the column holding your text.
          </p>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".txt,.csv,text/plain,text/csv"
              className="sr-only"
              onChange={(e) => {
                void readFile(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <span className="tile-skeu inline-flex h-10 items-center rounded-xl px-4 text-sm font-semibold">
              Upload .txt or .csv
            </span>
          </label>
          {csvRows ? (
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Text column
              </p>
              <select
                onChange={(e) => pickColumn(csvRows, Number(e.target.value))}
                className="tile-skeu w-full max-w-xs rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {csvRows[0]!.map((h, i) => (
                  <option key={`${i}-${h}`} value={i}>
                    {h || `Column ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "ai" ? (
        <div className="well-skeu space-y-3 rounded-xl p-4">
          <textarea
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            rows={3}
            placeholder="Generate short motivational quotes about discipline and success. Make each quote unique, powerful and under 12 words."
            className="tile-skeu w-full resize-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Number of texts
              </span>
              <input
                type="number"
                min={1}
                max={500}
                value={count}
                onChange={(e) => onCountChange(Math.max(1, Math.min(500, Number(e.target.value) || 1)))}
                className="tile-skeu h-10 w-28 rounded-xl px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            <Button variant="hero" onClick={onGenerate} disabled={generating}>
              {generating ? <Loader2 className="animate-spin" /> : <Sparkles />}
              {generating ? "Generating…" : `Generate Text`}
            </Button>
            {items.length ? (
              <Button variant="tile" className="h-11 rounded-xl" onClick={onGenerate} disabled={generating}>
                Regenerate all
              </Button>
            ) : null}
            {imageCount ? (
              <span className="text-xs text-muted-foreground">
                {imageCount} image{imageCount === 1 ? "" : "s"} uploaded
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      {mode === "manual" ? (
        <div className="well-skeu space-y-3 rounded-xl p-4">
          <textarea
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            rows={6}
            placeholder={"Believe in yourself.\nKeep moving forward.\nNever give up."}
            className="tile-skeu w-full resize-y rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            variant="tile"
            className="h-10 rounded-xl"
            onClick={() => {
              const lines = manual
                .split(/\r?\n/)
                .map((l) => l.trim())
                .filter(Boolean);
              if (!lines.length) {
                toast.error("Add at least one line.");
                return;
              }
              toItems(lines);
              toast.success(`${lines.length} text items ready`);
            }}
          >
            Use these lines
          </Button>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Text distribution
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {DISTRIBUTIONS.map((d) => (
            <button
              key={d.value}
              onClick={() => onDistributionChange(d.value)}
              aria-pressed={distribution === d.value}
              title={d.help}
              className={cn(
                "rounded-xl px-3 py-2 text-left text-sm transition-all",
                distribution === d.value ? "well-skeu text-primary" : "tile-skeu hover:brightness-[1.02]",
              )}
            >
              <span className="block font-semibold">{d.label}</span>
              <span className="block text-xs text-muted-foreground">{d.help}</span>
            </button>
          ))}
        </div>
      </div>

      <TextList items={items} onChange={onItemsChange} onRegenerateOne={onRegenerateOne} busy={generating} />
    </section>
  );
}
