import { useEffect, useRef, useState } from "react";
import { Eye, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { composeImage } from "@/lib/bulk/render";
import type { DesignSettings, TextItem, UploadedImage } from "@/lib/bulk/types";

export function LivePreview({
  images,
  texts,
  settings,
}: {
  images: UploadedImage[];
  texts: TextItem[];
  settings: DesignSettings;
}) {
  const [imageIndex, setImageIndex] = useState(0);
  const [textIndex, setTextIndex] = useState(0);
  const [url, setUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const current = useRef<string | null>(null);

  const image = images[Math.min(imageIndex, images.length - 1)];
  const text = texts[Math.min(textIndex, texts.length - 1)]?.text ?? "Your text appears here";

  useEffect(() => {
    if (!image) return;
    let cancelled = false;
    setPending(true);
    const timer = setTimeout(async () => {
      try {
        const blob = await composeImage(image.file, text, settings, 900);
        if (cancelled) return;
        if (current.current) URL.revokeObjectURL(current.current);
        const next = URL.createObjectURL(blob);
        current.current = next;
        setUrl(next);
      } catch {
        /* preview failures are non-fatal */
      } finally {
        if (!cancelled) setPending(false);
      }
    }, 180);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [image, text, settings]);

  useEffect(
    () => () => {
      if (current.current) URL.revokeObjectURL(current.current);
    },
    [],
  );

  return (
    <section className="tile-skeu rounded-2xl p-4 sm:p-5">
      <header className="mb-3 flex flex-wrap items-center gap-3">
        <h2 className="flex items-center gap-2 text-lg font-bold">
          <Eye className="size-5 text-primary" /> Live preview
        </h2>
        <Button
          variant="tile"
          className="ml-auto h-9 rounded-xl"
          disabled={!images.length}
          onClick={() => {
            setImageIndex(Math.floor(Math.random() * Math.max(1, images.length)));
            setTextIndex(Math.floor(Math.random() * Math.max(1, texts.length)));
          }}
        >
          <Shuffle /> Preview random
        </Button>
      </header>

      {!image ? (
        <div className="well-skeu grid h-56 place-items-center rounded-xl text-sm text-muted-foreground">
          Upload an image to see the preview.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <figure className="well-skeu rounded-xl p-2">
              <img
                src={image.previewUrl}
                alt="Original"
                className="aspect-square w-full rounded-lg object-cover"
              />
              <figcaption className="pt-1.5 text-center text-xs text-muted-foreground">Before</figcaption>
            </figure>
            <figure className="well-skeu rounded-xl p-2">
              {url ? (
                <img
                  src={url}
                  alt="Preview with text"
                  className="aspect-square w-full rounded-lg object-cover"
                  style={{ opacity: pending ? 0.75 : 1, transition: "opacity 150ms" }}
                />
              ) : (
                <div className="aspect-square w-full animate-pulse rounded-lg bg-muted" />
              )}
              <figcaption className="pt-1.5 text-center text-xs text-muted-foreground">After</figcaption>
            </figure>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Image
              </span>
              <select
                value={imageIndex}
                onChange={(e) => setImageIndex(Number(e.target.value))}
                className="well-skeu w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {images.map((img, i) => (
                  <option key={img.id} value={i}>
                    {i + 1}. {img.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Text
              </span>
              <select
                value={textIndex}
                onChange={(e) => setTextIndex(Number(e.target.value))}
                disabled={!texts.length}
                className="well-skeu w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {texts.length ? (
                  texts.map((t, i) => (
                    <option key={t.id} value={i}>
                      {i + 1}. {t.text.slice(0, 48)}
                    </option>
                  ))
                ) : (
                  <option value={0}>No text yet</option>
                )}
              </select>
            </label>
          </div>
        </>
      )}
    </section>
  );
}
