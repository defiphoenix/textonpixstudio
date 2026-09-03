import type { DesignSettings, Position } from "./types";

function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = Number.parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

function fontString(s: DesignSettings, px: number) {
  return `${s.italic ? "italic " : ""}${s.bold ? "700" : "400"} ${px}px ${s.fontFamily}`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
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
    if (line) out.push(line);
  }
  return out.length ? out : [""];
}

function anchor(position: Position) {
  const [v, h] = position.split("-") as ["top" | "center" | "bottom", "left" | "center" | "right"];
  return { v, h };
}

/** Choose the largest font size where the wrapped text fits the safe area. */
function autoFitSize(
  ctx: CanvasRenderingContext2D,
  s: DesignSettings,
  text: string,
  boxW: number,
  boxH: number,
) {
  let lo = Math.max(8, Math.round(boxW * 0.015));
  let hi = Math.round(boxW * 0.22);
  let best = lo;
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    ctx.font = fontString(s, mid);
    const lines = wrapLines(ctx, text, boxW);
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));
    const height = lines.length * mid * s.lineHeight;
    if (widest <= boxW && height <= boxH) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return best;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
  ctx.fill();
}

/** Draws `text` onto a canvas that already contains the source image. */
export function drawText(canvas: HTMLCanvasElement, text: string, s: DesignSettings) {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable in this browser.");

  const scale = canvas.width / 1000;
  const margin = canvas.width * 0.07;
  const boxW = canvas.width - margin * 2;
  const boxH = canvas.height - margin * 2;

  const spacing = s.letterSpacing * scale;
  ctx.letterSpacing = `${spacing}px`;

  const fontPx = s.autoFit
    ? autoFitSize(ctx, s, text, boxW, boxH)
    : Math.max(8, Math.round(s.fontSize * scale));
  ctx.font = fontString(s, fontPx);
  const lines = wrapLines(ctx, text, boxW);
  const lineHeight = fontPx * s.lineHeight;
  const blockH = lines.length * lineHeight;
  const widest = Math.max(...lines.map((l) => ctx.measureText(l).width));

  const { v, h } = anchor(s.position);
  const centerX =
    h === "left" ? margin + widest / 2 : h === "right" ? canvas.width - margin - widest / 2 : canvas.width / 2;
  const topY =
    v === "top" ? margin : v === "bottom" ? canvas.height - margin - blockH : (canvas.height - blockH) / 2;

  if (s.background !== "none") {
    const pad = s.backgroundPadding * scale;
    const alpha = s.background === "solid" ? 1 : s.backgroundOpacity;
    ctx.fillStyle = hexToRgba(s.backgroundColor, alpha);
    roundRect(
      ctx,
      centerX - widest / 2 - pad,
      topY - pad,
      widest + pad * 2,
      blockH + pad * 2,
      s.backgroundRadius * scale,
    );
  }

  ctx.textBaseline = "top";
  ctx.textAlign = s.align === "left" ? "left" : s.align === "right" ? "right" : "center";
  const drawX = s.align === "left" ? centerX - widest / 2 : s.align === "right" ? centerX + widest / 2 : centerX;

  lines.forEach((line, i) => {
    const y = topY + i * lineHeight + (lineHeight - fontPx) / 2;
    ctx.save();
    if (s.shadow) {
      ctx.shadowColor = `rgba(0,0,0,${s.shadowOpacity})`;
      ctx.shadowBlur = s.shadowBlur * scale;
      ctx.shadowOffsetY = s.shadowOffset * scale;
    }
    if (s.outline) {
      ctx.lineJoin = "round";
      ctx.lineWidth = Math.max(1, s.outlineWidth * scale);
      ctx.strokeStyle = s.outlineColor;
      ctx.strokeText(line, drawX, y);
    }
    ctx.globalAlpha = s.opacity;
    ctx.fillStyle = s.color;
    ctx.fillText(line, drawX, y);
    ctx.restore();
  });
}

async function bitmapFrom(file: File) {
  if (typeof createImageBitmap === "function") return createImageBitmap(file);
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Renders one composed image and returns a PNG blob. `maxWidth` caps memory for previews. */
export async function composeImage(file: File, text: string, s: DesignSettings, maxWidth?: number) {
  const source = await bitmapFrom(file);
  const sw = "width" in source ? source.width : 0;
  const sh = "height" in source ? source.height : 0;
  const ratio = maxWidth && sw > maxWidth ? maxWidth / sw : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sw * ratio));
  canvas.height = Math.max(1, Math.round(sh * ratio));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable in this browser.");
  ctx.drawImage(source as CanvasImageSource, 0, 0, canvas.width, canvas.height);
  if ("close" in source && typeof source.close === "function") source.close();
  drawText(canvas, text, s);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
  if (!blob) throw new Error("Could not export the composed image.");
  return blob;
}

export async function readImageMeta(file: File) {
  const source = await bitmapFrom(file);
  const width = "width" in source ? source.width : 0;
  const height = "height" in source ? source.height : 0;
  if ("close" in source && typeof source.close === "function") source.close();
  return { width, height };
}
