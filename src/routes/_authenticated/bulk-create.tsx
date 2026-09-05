import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import JSZip from "jszip";
import { Images, Layers, Sparkles, Wand2, Zap } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { ContentSourceSelector, type ContentMode } from "@/components/bulk/ContentSourceSelector";
import { DesignControls } from "@/components/bulk/DesignControls";
import { GenerationProgress } from "@/components/bulk/GenerationProgress";
import { ImageUploader } from "@/components/bulk/ImageUploader";
import { LivePreview } from "@/components/bulk/LivePreview";
import { ProjectSaveDialog } from "@/components/bulk/ProjectSaveDialog";
import { ResultsGallery } from "@/components/bulk/ResultsGallery";
import { StylePresets } from "@/components/bulk/StylePresets";
import { UsageIndicator, MONTHLY_LIMIT } from "@/components/bulk/UsageIndicator";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_SETTINGS } from "@/lib/bulk/presets";
import { composeImage } from "@/lib/bulk/render";
import type {
  DesignSettings,
  Distribution,
  FailedImage,
  GeneratedImage,
  TextItem,
  UploadedImage,
} from "@/lib/bulk/types";
import { generateQuotes } from "@/lib/quotes.functions";

export const Route = createFileRoute("/_authenticated/bulk-create")({
  head: () => ({
    meta: [
      { title: "Bulk Create — TextPix Studio" },
      {
        name: "description",
        content:
          "Upload hundreds of photos, add or AI-generate captions, style them once and download every finished graphic as a ZIP.",
      },
      { property: "og:title", content: "Bulk Create — TextPix Studio" },
      {
        property: "og:description",
        content: "Create hundreds of finished text graphics in minutes with TextPix Studio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BulkCreatePage,
});

const CONCURRENCY = 4;
const AI_CHUNK = 50;

function BulkCreatePage() {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [mode, setMode] = useState<ContentMode>("ai");
  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(10);
  const [distribution, setDistribution] = useState<Distribution>("sequential");
  const [settings, setSettings] = useState<DesignSettings>(DEFAULT_SETTINGS);
  const [presetName, setPresetName] = useState<string | null>(null);
  const [savedPresets, setSavedPresets] = useState<
    { id: string; name: string; settings: DesignSettings }[]
  >([]);
  const [generatingText, setGeneratingText] = useState(false);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(0);
  const [results, setResults] = useState<GeneratedImage[]>([]);
  const [failed, setFailed] = useState<FailedImage[]>([]);
  const [zipping, setZipping] = useState(false);
  const [used, setUsed] = useState(0);
  const generateText = useServerFn(generateQuotes);
  const countTouched = useRef(false);

  useEffect(() => {
    if (!countTouched.current && images.length) setCount(images.length);
  }, [images.length]);

  useEffect(() => {
    void (async () => {
      const { data } = await supabase
        .from("design_presets")
        .select("id,name,settings")
        .order("created_at", { ascending: false });
      if (data) {
        setSavedPresets(
          data.map((d) => ({
            id: d.id,
            name: d.name,
            settings: { ...DEFAULT_SETTINGS, ...(d.settings as Partial<DesignSettings>) },
          })),
        );
      }
      const { data: projects } = await supabase.from("bulk_projects").select("generated_count");
      if (projects) setUsed(projects.reduce((n, p) => n + (p.generated_count ?? 0), 0));
    })();
  }, []);

  const patchSettings = useCallback((patch: Partial<DesignSettings>) => {
    setSettings((s) => ({ ...s, ...patch }));
  }, []);

  const askAi = async (n: number) => {
    const lines: string[] = [];
    let remaining = n;
    while (remaining > 0) {
      const chunk = Math.min(AI_CHUNK, remaining);
      const res = await generateText({ data: { prompt, count: chunk } });
      lines.push(...res.lines);
      remaining -= chunk;
      if (!res.lines.length) break;
    }
    return lines.slice(0, n);
  };

  const handleGenerateText = async () => {
    if (!prompt.trim()) {
      toast.error("Add a prompt first so the AI knows what to write.");
      return;
    }
    setGeneratingText(true);
    try {
      const lines = await askAi(count);
      setTexts(lines.map((text) => ({ id: crypto.randomUUID(), text })));
      toast.success(`${lines.length} texts generated`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Text generation failed.");
    } finally {
      setGeneratingText(false);
    }
  };

  const handleRegenerateOne = async (id: string) => {
    if (!prompt.trim()) {
      toast.error("Add a prompt to regenerate this line.");
      return;
    }
    setGeneratingText(true);
    try {
      const lines = await askAi(1);
      if (lines[0]) setTexts((t) => t.map((i) => (i.id === id ? { ...i, text: lines[0]! } : i)));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not regenerate that line.");
    } finally {
      setGeneratingText(false);
    }
  };

  const assignments = useMemo(() => {
    if (!images.length) return [] as { image: UploadedImage; text: string }[];
    const pool = texts.map((t) => t.text).filter(Boolean);
    return images.map((image, i) => {
      if (!pool.length) return { image, text: "" };
      if (distribution === "random") return { image, text: pool[Math.floor(Math.random() * pool.length)]! };
      if (distribution === "sequential") return { image, text: pool[i] ?? "" };
      return { image, text: pool[i % pool.length]! };
    });
  }, [images, texts, distribution]);

  const expected = assignments.filter((a) => a.text).length;

  const runBatch = async (jobs: { image: UploadedImage; text: string }[]) => {
    setRunning(true);
    setDone(0);
    setFailed([]);
    setResults([]);
    let index = 0;
    let completed = 0;

    const worker = async () => {
      while (index < jobs.length) {
        const job = jobs[index++]!;
        try {
          const blob = await composeImage(job.image.file, job.text, settings);
          const name = `${job.image.name.replace(/\.[^.]+$/, "")}-textpix.png`;
          setResults((r) => [
            ...r,
            {
              id: crypto.randomUUID(),
              imageId: job.image.id,
              name,
              text: job.text,
              url: URL.createObjectURL(blob),
            },
          ]);
        } catch (e) {
          setFailed((f) => [
            ...f,
            {
              id: job.image.id,
              name: job.image.name,
              reason: e instanceof Error ? e.message : "Unknown rendering error",
            },
          ]);
        } finally {
          completed += 1;
          setDone(completed);
          await new Promise((r) => setTimeout(r, 0));
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
    setRunning(false);
    setUsed((u) => u + jobs.length);
  };

  const handleGenerate = async () => {
    if (!images.length) {
      toast.error("Upload some images first.");
      return;
    }
    let list = texts;
    if (distribution === "generate" && texts.length < images.length && prompt.trim()) {
      setGeneratingText(true);
      try {
        const extra = await askAi(images.length - texts.length);
        list = [...texts, ...extra.map((text) => ({ id: crypto.randomUUID(), text }))];
        setTexts(list);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not generate the missing texts.");
      } finally {
        setGeneratingText(false);
      }
    }
    if (!list.some((t) => t.text.trim())) {
      toast.error("Add or generate some text first.");
      return;
    }
    const pool = list.map((t) => t.text).filter(Boolean);
    const jobs = images.map((image, i) => ({
      image,
      text:
        distribution === "random"
          ? pool[Math.floor(Math.random() * pool.length)]!
          : distribution === "sequential"
            ? (pool[i] ?? "")
            : pool[i % pool.length]!,
    }));
    const valid = jobs.filter((j) => j.text.trim());
    await runBatch(valid);
    toast.success("Batch finished");
  };

  const retryFailed = async () => {
    const jobs = failed
      .map((f) => {
        const image = images.find((i) => i.id === f.id);
        const match = assignments.find((a) => a.image.id === f.id);
        return image && match?.text ? { image, text: match.text } : null;
      })
      .filter(Boolean) as { image: UploadedImage; text: string }[];
    if (!jobs.length) return;
    const keep = results;
    await runBatch(jobs);
    setResults((r) => [...keep, ...r]);
  };

  const regenerateOne = async (id: string) => {
    const target = results.find((r) => r.id === id);
    if (!target) return;
    const image = images.find((i) => i.id === target.imageId);
    if (!image) return;
    try {
      const blob = await composeImage(image.file, target.text, settings);
      URL.revokeObjectURL(target.url);
      const url = URL.createObjectURL(blob);
      setResults((r) => r.map((x) => (x.id === id ? { ...x, url } : x)));
      toast.success("Image regenerated");
    } catch {
      toast.error("Could not regenerate that image.");
    }
  };

  const zipName = `textonpix-bulk-${new Date().toISOString().slice(0, 10)}.zip`;

  const downloadZip = async (ids?: string[]) => {
    const chosen = ids ? results.filter((r) => ids.includes(r.id)) : results;
    if (!chosen.length) return;
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const r of chosen) {
        const blob = await fetch(r.url).then((res) => res.blob());
        zip.file(r.name, blob);
      }
      const out = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(out);
      const a = document.createElement("a");
      a.href = url;
      a.download = zipName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
    } catch {
      toast.error("Could not build the ZIP file.");
    } finally {
      setZipping(false);
    }
  };

  const saveProject = async (name: string) => {
    const { error } = await supabase.from("bulk_projects").insert({
      user_id: (await supabase.auth.getUser()).data.user?.id as string,
      name,
      prompt,
      texts: texts as unknown as never,
      settings: settings as unknown as never,
      image_count: images.length,
      generated_count: results.length,
    });
    if (error) toast.error("Could not save the project.");
    else toast.success("Project saved");
  };

  const savePreset = async () => {
    const name = window.prompt("Preset name", presetName ?? "My style");
    if (!name) return;
    const { data, error } = await supabase
      .from("design_presets")
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id as string,
        name,
        settings: settings as unknown as never,
      })
      .select("id,name,settings")
      .single();
    if (error || !data) {
      toast.error("Could not save that preset.");
      return;
    }
    setSavedPresets((p) => [{ id: data.id, name: data.name, settings }, ...p]);
    setPresetName(name);
    toast.success("Preset saved");
  };

  const empty = !images.length && !texts.length && !results.length;
  const limitReached = used >= MONTHLY_LIMIT;

  return (
    <PageShell
      title="Bulk Create"
      intro="Upload your images, add your text or let AI write it, choose a style, and create everything automatically."
    >
      {empty ? (
        <div className="tile-skeu rounded-2xl p-6 text-center sm:p-10">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-raised)]">
            <Layers className="size-6 text-primary-foreground" />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold sm:text-3xl">Create hundreds of graphics at once</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
            Upload your images, add your text or let AI generate it, choose a style, and create everything
            automatically.
          </p>
          <div className="mt-5 grid gap-2 sm:grid-cols-4">
            {[
              { icon: Images, label: "1. Upload" },
              { icon: Sparkles, label: "2. Add text" },
              { icon: Wand2, label: "3. Style" },
              { icon: Zap, label: "4. Generate" },
            ].map((s) => (
              <div key={s.label} className="well-skeu rounded-xl px-3 py-4">
                <s.icon className="mx-auto size-5 text-primary" />
                <p className="mt-1.5 text-sm font-semibold">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <ImageUploader images={images} onChange={setImages} />
          <ContentSourceSelector
            mode={mode}
            onModeChange={setMode}
            items={texts}
            onItemsChange={setTexts}
            prompt={prompt}
            onPromptChange={setPrompt}
            count={count}
            onCountChange={(n) => {
              countTouched.current = true;
              setCount(n);
            }}
            distribution={distribution}
            onDistributionChange={setDistribution}
            imageCount={images.length}
            onGenerate={handleGenerateText}
            onRegenerateOne={handleRegenerateOne}
            generating={generatingText}
          />
        </div>

        <div className="space-y-4">
          <UsageIndicator used={used} />
          <StylePresets
            activeName={presetName}
            onApply={(name, patch) => {
              setPresetName(name);
              patchSettings(patch);
            }}
            savedPresets={savedPresets}
            onApplySaved={(s, name) => {
              setPresetName(name);
              setSettings(s);
            }}
            onSaveCurrent={savePreset}
          />
          <DesignControls settings={settings} onChange={patchSettings} />
          <LivePreview images={images} texts={texts} settings={settings} />
        </div>
      </div>

      <section className="tile-skeu mt-4 rounded-2xl p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2 text-xs">
            {[
              `${images.length} images`,
              `${texts.length} texts`,
              settings.fontFamily.split(",")[0]!.replace(/'/g, ""),
              `Auto Fit ${settings.autoFit ? "ON" : "OFF"}`,
              `${settings.position.replace("-", " ")} position`,
            ].map((chip) => (
              <span key={chip} className="well-skeu rounded-full px-3 py-1 font-semibold capitalize">
                {chip}
              </span>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap gap-2">
            <ProjectSaveDialog
              defaultName={`Bulk project — ${new Date().toLocaleDateString()}`}
              onSave={saveProject}
              disabled={!images.length && !texts.length}
            />
            <Button
              variant="hero"
              className="h-12 px-6 text-base"
              disabled={running || limitReached || !images.length}
              onClick={handleGenerate}
            >
              <Zap /> {running ? "Generating…" : `Generate ${expected || images.length} images`}
            </Button>
          </div>
        </div>
        {limitReached ? (
          <p className="mt-3 text-sm text-destructive">
            You've reached this month's image limit. Upgrade to keep generating.
          </p>
        ) : null}
      </section>

      {running ? (
        <div className="mt-4">
          <GenerationProgress total={expected || images.length} done={done} failed={failed} results={results} />
        </div>
      ) : null}

      {!running && (results.length || failed.length) ? (
        <div className="mt-4">
          <ResultsGallery
            results={results}
            failed={failed}
            onDelete={(id) => setResults((r) => r.filter((x) => x.id !== id))}
            onRegenerate={regenerateOne}
            onRetryFailed={retryFailed}
            onDownloadZip={downloadZip}
            onDownloadSelected={(ids) => downloadZip(ids)}
            zipping={zipping}
          />
        </div>
      ) : null}
    </PageShell>
  );
}
