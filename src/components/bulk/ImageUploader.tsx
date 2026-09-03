import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ImagePlus, Trash2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readImageMeta } from "@/lib/bulk/render";
import type { UploadedImage } from "@/lib/bulk/types";
import { cn } from "@/lib/utils";

const ACCEPTED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_BYTES = 25 * 1024 * 1024;

export function ImageUploader({
  images,
  onChange,
}: {
  images: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
}) {
  const [over, setOver] = useState(false);
  const [reading, setReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const add = async (incoming: FileList | File[] | null) => {
    const list = Array.from(incoming ?? []);
    if (!list.length) return;
    setReading(true);
    const seen = new Set(images.map((i) => `${i.name}:${i.size}`));
    const rejected: string[] = [];
    const next: UploadedImage[] = [];
    for (const file of list) {
      const key = `${file.name}:${file.size}`;
      if (seen.has(key)) continue;
      if (!ACCEPTED.includes(file.type)) {
        rejected.push(`${file.name} (unsupported type)`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        rejected.push(`${file.name} (over 25MB)`);
        continue;
      }
      seen.add(key);
      try {
        const { width, height } = await readImageMeta(file);
        next.push({
          id: crypto.randomUUID(),
          file,
          name: file.name,
          size: file.size,
          previewUrl: URL.createObjectURL(file),
          width,
          height,
        });
      } catch {
        rejected.push(`${file.name} (could not be read)`);
      }
    }
    setReading(false);
    if (next.length) {
      onChange([...images, ...next]);
      toast.success(`${next.length} image${next.length === 1 ? "" : "s"} added`);
    }
    if (rejected.length) toast.error(`Skipped ${rejected.length}: ${rejected.slice(0, 3).join(", ")}`);
  };

  const remove = (id: string) => {
    const target = images.find((i) => i.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(images.filter((i) => i.id !== id));
  };

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  const clearAll = () => {
    images.forEach((i) => URL.revokeObjectURL(i.previewUrl));
    onChange([]);
  };

  return (
    <section className="tile-skeu rounded-2xl p-4 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ImagePlus className="size-5 text-primary" /> Upload Your Images
          </h2>
          <p className="text-sm text-muted-foreground">
            Add multiple images and create text-based graphics in bulk.
          </p>
        </div>
        {images.length ? (
          <div className="ml-auto flex items-center gap-2">
            <span className="well-skeu rounded-full px-3 py-1 text-sm font-semibold text-primary">
              {images.length} images selected
            </span>
            <Button variant="tile" className="h-9 rounded-xl" onClick={clearAll}>
              <Trash2 /> Clear all
            </Button>
          </div>
        ) : null}
      </header>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void add(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        aria-label="Upload images"
        className={cn(
          "well-skeu grid cursor-pointer place-items-center rounded-2xl px-6 py-10 text-center transition-all focus:outline-none focus:ring-2 focus:ring-ring",
          over && "ring-2 ring-ring",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            void add(e.target.files);
            e.target.value = "";
          }}
        />
        <UploadCloud className="size-9 text-primary" />
        <p className="mt-3 text-sm font-semibold">
          {reading ? "Reading images…" : "Drop images here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">JPG, JPEG, PNG or WEBP · up to 25MB each</p>
      </div>

      {images.length ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {images.map((img, i) => (
            <li key={img.id} className="well-skeu group relative rounded-xl p-1.5">
              <img
                src={img.previewUrl}
                alt={img.name}
                loading="lazy"
                className="aspect-square w-full rounded-lg object-cover"
              />
              <p className="mt-1.5 truncate px-1 text-xs font-medium" title={img.name}>
                {img.name}
              </p>
              <p className="px-1 text-[11px] text-muted-foreground">
                {img.width}×{img.height}
              </p>
              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  aria-label={`Move ${img.name} earlier`}
                  onClick={() => move(i, -1)}
                  className="tile-skeu grid size-7 place-items-center rounded-lg"
                >
                  <ArrowLeft className="size-3.5" />
                </button>
                <button
                  aria-label={`Move ${img.name} later`}
                  onClick={() => move(i, 1)}
                  className="tile-skeu grid size-7 place-items-center rounded-lg"
                >
                  <ArrowRight className="size-3.5" />
                </button>
                <button
                  aria-label={`Remove ${img.name}`}
                  onClick={() => remove(img.id)}
                  className="tile-skeu grid size-7 place-items-center rounded-lg text-destructive"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
