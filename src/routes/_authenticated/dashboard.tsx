import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Download, ImagePlus, Loader2, Sparkles, Type, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { PageShell } from "@/components/PageShell";
import { generateQuotes } from "@/lib/quotes.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Batch Dashboard – TextPix Image Text Editor" },
      {
        name: "description",
        content:
          "Upload many photos, add quotes from a text file or an AI prompt, pick a font, and download every captioned image.",
      },
      { property: "og:title", content: "Batch Dashboard – TextPix" },
      {
        property: "og:description",
        content: "Bulk-caption photos with quotes from a text file or AI prompt, then download them all.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const FONTS = [
  { label: "Great Vibes", css: "'Great Vibes', cursive" },
  { label: "Playfair Display", css: "'Playfair Display', serif" },
  { label: "Bebas Neue", css: "'Bebas Neue', sans-serif" },
  { label: "Anton", css: "Anton, sans-serif" },
  { label: "Lobster", css: "Lobster, cursive" },
  { label: "Space Grotesk", css: "'Space Grotesk', sans-serif" },
];

const COLORS = ["#ffffff", "#111827", "#7fd0f5", "#f7b5cd", "#a855f7", "#f59e0b"];

type Source = "file" | "prompt";
type Result = { name: string; url: string; line: string };

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const out: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        out.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    out.push(line);
  }
  return out.filter((l) => l.length > 0);
}

function Dashboard() {
  const [files, setFiles] = useState<File[]>([]);
  const [source, setSource] = useState<Source>("prompt");
  const [lines, setLines] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("calm, uplifting one-line quotes about nature and slowing down");
  const [font, setFont] = useState(FONTS[0]!.css);
  const [color, setColor] = useState("#ffffff");
  const [sizePct, setSizePct] = useState(7);
  const [posY, setPosY] = useState(50);
  const [shadow, setShadow] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[]>([]);
  const urls = useRef<string[]>([]);
  const runQuotes = useServerFn(generateQuotes);

  const previews = useMemo(() => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })), [files]);

  const readTextFile = async (file?: File | null) => {
    if (!file) return;
    const raw = await file.text();
    const parsed = raw
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    setLines(parsed);
    setSource("file");
    setError(parsed.length ? null : "That text file had no usable lines.");
  };

  const generate = async () => {
    if (!files.length) {
      setError("Upload at least one image first.");
      return;
    }
    setBusy("Writing sentences…");
    setError(null);
    try {
      const res = await runQuotes({ data: { prompt, count: files.length } });
      setLines(res.lines);
      setSource("prompt");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate sentences.");
    } finally {
      setBusy(null);
    }
  };

  const process = async () => {
    if (!files.length) {
      setError("Upload at least one image first.");
      return;
    }
    if (!lines.length) {
      setError("Add captions with a text file or an AI prompt first.");
      return;
    }
    setBusy("Embedding text…");
    setError(null);
    urls.current.forEach((u) => URL.revokeObjectURL(u));
    urls.current = [];
    const out: Result[] = [];
    try {
      await (document as Document & { fonts?: FontFaceSet }).fonts?.ready;
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]!;
        const line = lines[i % lines.length]!;
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas is unavailable in this browser.");
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();

        const fontPx = Math.round((sizePct / 100) * canvas.width);
        ctx.font = `700 ${fontPx}px ${font}`;
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if (shadow) {
          ctx.shadowColor = "rgba(0,0,0,0.5)";
          ctx.shadowBlur = fontPx * 0.3;
          ctx.shadowOffsetY = fontPx * 0.06;
        }
        const wrapped = wrap(ctx, line, canvas.width * 0.86);
        const lineHeight = fontPx * 1.22;
        const startY = (posY / 100) * canvas.height - ((wrapped.length - 1) * lineHeight) / 2;
        wrapped.forEach((l, idx) => ctx.fillText(l, canvas.width / 2, startY + idx * lineHeight));

        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (!blob) throw new Error("Could not export one of the images.");
        const url = URL.createObjectURL(blob);
        urls.current.push(url);
        out.push({ name: file.name.replace(/\.[^.]+$/, "") + "-textpix.png", url, line });
      }
      setResults(out);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed.");
    } finally {
      setBusy(null);
    }
  };

  const downloadAll = () => {
    results.forEach((r, i) => {
      setTimeout(() => {
        const a = document.createElement("a");
        a.href = r.url;
        a.download = r.name;
        a.click();
      }, i * 250);
    });
  };

  return (
    <PageShell
      title="Batch Dashboard"
      subtitle="Upload a stack of photos, bring your own quotes file or let AI write them, then embed and download in one pass."
    >
      <div className="grid gap-3 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          <section className="tile-skeu rounded-2xl p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <ImagePlus className="size-4 text-primary" /> 1. Images
            </h2>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              />
              <span className="well-skeu inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium">
                Choose image files
              </span>
            </label>
            <span className="ml-3 text-sm text-muted-foreground">
              {files.length ? `${files.length} selected` : "No files yet"}
            </span>
            {previews.length ? (
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                {previews.map((p) => (
                  <img
                    key={p.url}
                    src={p.url}
                    alt={p.name}
                    className="well-skeu aspect-square w-full rounded-xl object-cover p-1"
                  />
                ))}
              </div>
            ) : null}
          </section>

          <section className="tile-skeu rounded-2xl p-4">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold">
              <Sparkles className="size-4 text-primary" /> 2. Captions
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="well-skeu space-y-2 rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Text file (one quote per line)
                </p>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".txt,text/plain"
                    className="sr-only"
                    onChange={(e) => readTextFile(e.target.files?.[0])}
                  />
                  <span className="tile-skeu inline-flex h-10 items-center rounded-xl px-4 text-sm font-medium">
                    Upload .txt
                  </span>
                </label>
              </div>
              <div className="well-skeu space-y-2 rounded-xl p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Or an AI prompt
                </p>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={2}
                  className="tile-skeu w-full resize-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button variant="tile" className="h-10 rounded-xl" onClick={generate} disabled={!!busy}>
                  <Wand2 /> Generate {files.length || ""} sentence{files.length === 1 ? "" : "s"}
                </Button>
              </div>
            </div>
            {lines.length ? (
              <div className="well-skeu mt-3 max-h-40 overflow-auto rounded-xl p-3 text-sm">
                <p className="mb-1 text-xs text-muted-foreground">
                  {lines.length} line{lines.length === 1 ? "" : "s"} from {source === "file" ? "your file" : "AI"}
                </p>
                <ol className="list-decimal space-y-1 pl-5">
                  {lines.map((l, i) => (
                    <li key={`${i}-${l}`}>{l}</li>
                  ))}
                </ol>
              </div>
            ) : null}
          </section>

          {results.length ? (
            <section className="tile-skeu rounded-2xl p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-bold">3. Results</h2>
                <Button variant="hero" onClick={downloadAll}>
                  <Download /> Download all
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {results.map((r) => (
                  <a
                    key={r.url}
                    href={r.url}
                    download={r.name}
                    className="well-skeu block rounded-xl p-1 transition-transform hover:scale-[1.02]"
                  >
                    <img src={r.url} alt={r.line} className="aspect-square w-full rounded-lg object-cover" />
                  </a>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="tile-skeu space-y-4 self-start rounded-2xl p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Type className="size-4 text-primary" /> Style
          </h2>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Font</p>
            <select
              value={font}
              onChange={(e) => setFont(e.target.value)}
              style={{ fontFamily: font }}
              className="well-skeu w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {FONTS.map((f) => (
                <option key={f.label} value={f.css} style={{ fontFamily: f.css }}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Color</p>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  aria-label={`Color ${c}`}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={cn(
                    "size-7 rounded-full border border-border shadow-[var(--shadow-raised)]",
                    color === c && "ring-2 ring-ring ring-offset-2",
                  )}
                />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Text size</p>
              <span className="well-skeu rounded-md px-2 py-0.5 text-xs">{sizePct}%</span>
            </div>
            <Slider min={3} max={16} value={[sizePct]} onValueChange={(v) => setSizePct(v[0] ?? sizePct)} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vertical spot</p>
              <span className="well-skeu rounded-md px-2 py-0.5 text-xs">{posY}%</span>
            </div>
            <Slider min={8} max={92} value={[posY]} onValueChange={(v) => setPosY(v[0] ?? posY)} />
          </div>
          <button
            onClick={() => setShadow(!shadow)}
            aria-pressed={shadow}
            className={cn(
              "flex h-9 w-full items-center justify-center rounded-xl text-sm",
              shadow ? "well-skeu text-primary" : "tile-skeu",
            )}
          >
            Text shadow
          </button>
          <Button variant="hero" className="w-full" onClick={process} disabled={!!busy}>
            {busy ? <Loader2 className="animate-spin" /> : <Sparkles />} {busy ?? "Process & preview"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </aside>
      </div>
    </PageShell>
  );
}
