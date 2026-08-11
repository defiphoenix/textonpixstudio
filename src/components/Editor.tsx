import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Download,
  Italic,
  Save,
  Underline,
  UploadCloud,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import samplePhoto from "@/assets/sample-photo.jpg";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const FONTS = [
  { label: "Great Vibes", css: "'Great Vibes', cursive" },
  { label: "Playfair Display", css: "'Playfair Display', serif" },
  { label: "Bebas Neue", css: "'Bebas Neue', sans-serif" },
  { label: "Anton", css: "Anton, sans-serif" },
  { label: "Lobster", css: "Lobster, cursive" },
  { label: "Space Grotesk", css: "'Space Grotesk', sans-serif" },
];

const COLORS = ["#111827", "#ffffff", "#7fd0f5", "#f7b5cd", "#a855f7", "#f59e0b"];

type Align = "left" | "center" | "right";

export function Editor() {
  const [image, setImage] = useState<string>(samplePhoto);
  const [text, setText] = useState("Find Beauty\nin every moment");
  const [font, setFont] = useState<string>(FONTS[0]!.css);
  const [size, setSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [align, setAlign] = useState<Align>("center");
  const [shadow, setShadow] = useState(true);
  const [pos, setPos] = useState({ x: 50, y: 45 });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const { user } = useSession();
  const stageRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    return () => {
      if (image.startsWith("blob:")) URL.revokeObjectURL(image);
    };
  }, [image]);

  const onFile = (file?: File | null) => {
    if (!file) return;
    setImage(URL.createObjectURL(file));
  };

  const move = useCallback((clientX: number, clientY: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: Math.min(98, Math.max(2, ((clientX - rect.left) / rect.width) * 100)),
      y: Math.min(98, Math.max(2, ((clientY - rect.top) / rect.height) * 100)),
    });
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (dragging.current) move(e.clientX, e.clientY);
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [move]);

  const renderCanvas = async () => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = image;
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = rej;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    const stageWidth = stageRef.current?.clientWidth ?? canvas.width;
    const scale = canvas.width / stageWidth;
    const fontPx = size * scale;
    ctx.font = `${italic ? "italic " : ""}${bold ? "700 " : "400 "}${fontPx}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = align === "left" ? "left" : align === "right" ? "right" : "center";
    ctx.textBaseline = "middle";
    if (shadow) {
      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = fontPx * 0.25;
      ctx.shadowOffsetY = fontPx * 0.06;
    }
    const lines = text.split("\n");
    const lineHeight = fontPx * 1.2;
    const x = (pos.x / 100) * canvas.width;
    const startY = (pos.y / 100) * canvas.height - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, i) => {
      const y = startY + i * lineHeight;
      ctx.fillText(line, x, y);
      if (underline) {
        const w = ctx.measureText(line).width;
        const ux = align === "left" ? x : align === "right" ? x - w : x - w / 2;
        ctx.fillRect(ux, y + fontPx * 0.55, w, Math.max(1, fontPx * 0.05));
      }
    });

    return canvas;
  };

  const download = async () => {
    const canvas = await renderCanvas();
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "textpix.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setStatus(null);
    try {
      const canvas = await renderCanvas();
      if (!canvas) throw new Error("Could not render the image");
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (!blob) throw new Error("Could not export the image");
      const path = `${user.id}/${crypto.randomUUID()}.png`;
      const up = await supabase.storage.from("edits").upload(path, blob, {
        contentType: "image/png",
      });
      if (up.error) throw up.error;
      const { error } = await supabase.from("edits").insert({
        user_id: user.id,
        title: text.split("\n")[0]?.slice(0, 60) || "Untitled",
        image_path: path,
        text_content: text,
        font,
        font_size: size,
        color,
        align,
        bold,
        italic,
        underline,
        shadow,
        pos_x: pos.x,
        pos_y: pos.y,
      });
      if (error) throw error;
      setStatus("Saved to your history.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not save this edit.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="panel-skeu rounded-3xl p-3 sm:p-4">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
          <span className="tile-skeu inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium">
            <UploadCloud className="size-4 text-primary" /> Upload Image
          </span>
        </label>
        <div className="ml-auto flex items-center gap-3">
          {user ? (
            <Button variant="tile" size="lg" className="rounded-xl" onClick={save} disabled={saving}>
              <Save /> {saving ? "Saving…" : "Save"}
            </Button>
          ) : (
            <Button variant="tile" size="lg" className="rounded-xl" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                <Save /> Save to history
              </Link>
            </Button>
          )}
          <Button variant="hero" size="lg" onClick={download}>
            <Download /> Download
          </Button>
        </div>
      </div>
      {status ? <p className="mb-3 text-sm text-primary">{status}</p> : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_17rem]">
        <div
          ref={stageRef}
          className="well-skeu relative aspect-[6/5] w-full overflow-hidden rounded-2xl"
        >
          <img src={image} alt="Photo being edited" className="absolute inset-0 size-full object-cover" />
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              dragging.current = true;
            }}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              fontFamily: font,
              fontSize: size,
              color,
              fontWeight: bold ? 700 : 400,
              fontStyle: italic ? "italic" : "normal",
              textDecoration: underline ? "underline" : "none",
              textAlign: align,
              textShadow: shadow ? "0 2px 14px rgba(0,0,0,0.45)" : "none",
              lineHeight: 1.2,
            }}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-move select-none whitespace-pre rounded-md px-2 outline-1 outline-dashed outline-white/70"
          >
            {text || "Your text"}
          </div>
        </div>

        <div className="tile-skeu space-y-4 rounded-2xl p-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Add Text
            </p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={2}
              className="well-skeu w-full resize-none rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Font
            </p>
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Style
            </p>
            <div className="grid grid-cols-3 gap-2">
              <ToggleTile active={bold} onClick={() => setBold(!bold)} label="Bold">
                <Bold className="size-4" />
              </ToggleTile>
              <ToggleTile active={italic} onClick={() => setItalic(!italic)} label="Italic">
                <Italic className="size-4" />
              </ToggleTile>
              <ToggleTile active={underline} onClick={() => setUnderline(!underline)} label="Underline">
                <Underline className="size-4" />
              </ToggleTile>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {(["left", "center", "right"] as Align[]).map((a) => (
                <ToggleTile key={a} active={align === a} onClick={() => setAlign(a)} label={`Align ${a}`}>
                  {a === "left" ? (
                    <AlignLeft className="size-4" />
                  ) : a === "center" ? (
                    <AlignCenter className="size-4" />
                  ) : (
                    <AlignRight className="size-4" />
                  )}
                </ToggleTile>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Color
            </p>
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
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Size
              </p>
              <span className="well-skeu rounded-md px-2 py-0.5 text-xs">{size}</span>
            </div>
            <Slider min={16} max={120} value={[size]} onValueChange={(v) => setSize(v[0] ?? size)} />
          </div>

          <ToggleTile active={shadow} onClick={() => setShadow(!shadow)} label="Shadow" wide>
            <span className="text-sm">Text shadow</span>
          </ToggleTile>
        </div>
      </div>
    </div>
  );
}

function ToggleTile({
  active,
  onClick,
  label,
  children,
  wide,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center gap-2 rounded-xl text-foreground transition-all",
        wide && "w-full",
        active
          ? "well-skeu text-primary"
          : "tile-skeu hover:brightness-[1.02]",
      )}
    >
      {children}
    </button>
  );
}