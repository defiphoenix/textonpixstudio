import { AlignCenter, AlignLeft, AlignRight, Bold, ChevronDown, Italic, Type } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { FONTS, POSITIONS } from "@/lib/bulk/presets";
import type { BackgroundMode, DesignSettings, Position } from "@/lib/bulk/types";
import { cn } from "@/lib/utils";

const COLORS = ["#ffffff", "#111827", "#7fd0f5", "#f7b5cd", "#a855f7", "#f59e0b", "#22c55e"];

export function DesignControls({
  settings,
  onChange,
}: {
  settings: DesignSettings;
  onChange: (patch: Partial<DesignSettings>) => void;
}) {
  return (
    <section className="tile-skeu space-y-5 rounded-2xl p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Type className="size-5 text-primary" /> Design
      </h2>

      <Field label="Font">
        <select
          value={settings.fontFamily}
          onChange={(e) => onChange({ fontFamily: e.target.value })}
          style={{ fontFamily: settings.fontFamily }}
          className="well-skeu w-full rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
        >
          {FONTS.map((f) => (
            <option key={f.label} value={f.css} style={{ fontFamily: f.css }}>
              {f.label}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Text position">
        <div className="grid grid-cols-3 gap-1.5">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              title={p.label}
              aria-label={p.label}
              aria-pressed={settings.position === p.value}
              onClick={() => onChange({ position: p.value as Position })}
              className={cn(
                "h-9 rounded-lg text-[11px] font-medium transition-all",
                settings.position === p.value ? "well-skeu text-primary" : "tile-skeu",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Font size">
        <button
          onClick={() => onChange({ autoFit: !settings.autoFit })}
          aria-pressed={settings.autoFit}
          className={cn(
            "mb-2 h-9 w-full rounded-xl text-sm font-semibold",
            settings.autoFit ? "well-skeu text-primary" : "tile-skeu",
          )}
        >
          Auto Fit {settings.autoFit ? "ON" : "OFF"}
        </button>
        {!settings.autoFit ? (
          <div className="flex items-center gap-3">
            <Slider
              min={12}
              max={220}
              value={[settings.fontSize]}
              onValueChange={(v) => onChange({ fontSize: v[0] ?? settings.fontSize })}
            />
            <input
              type="number"
              min={12}
              max={220}
              value={settings.fontSize}
              onChange={(e) => onChange({ fontSize: Number(e.target.value) || settings.fontSize })}
              className="well-skeu h-9 w-20 rounded-lg px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Each image gets its own size so long quotes shrink and short quotes stay large.
          </p>
        )}
      </Field>

      <Field label="Alignment & weight">
        <div className="grid grid-cols-5 gap-1.5">
          {(["left", "center", "right"] as const).map((a) => (
            <Toggle
              key={a}
              label={`Align ${a}`}
              active={settings.align === a}
              onClick={() => onChange({ align: a })}
            >
              {a === "left" ? (
                <AlignLeft className="size-4" />
              ) : a === "center" ? (
                <AlignCenter className="size-4" />
              ) : (
                <AlignRight className="size-4" />
              )}
            </Toggle>
          ))}
          <Toggle label="Bold" active={settings.bold} onClick={() => onChange({ bold: !settings.bold })}>
            <Bold className="size-4" />
          </Toggle>
          <Toggle
            label="Italic"
            active={settings.italic}
            onClick={() => onChange({ italic: !settings.italic })}
          >
            <Italic className="size-4" />
          </Toggle>
        </div>
      </Field>

      <Field label="Color">
        <div className="flex flex-wrap items-center gap-2">
          {COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Color ${c}`}
              onClick={() => onChange({ color: c })}
              style={{ backgroundColor: c }}
              className={cn(
                "size-7 rounded-full border border-border shadow-[var(--shadow-raised)]",
                settings.color === c && "ring-2 ring-ring ring-offset-2",
              )}
            />
          ))}
          <input
            type="color"
            aria-label="Custom text color"
            value={settings.color}
            onChange={(e) => onChange({ color: e.target.value })}
            className="well-skeu size-8 rounded-lg p-1"
          />
        </div>
      </Field>

      <details className="well-skeu rounded-xl p-3">
        <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <ChevronDown className="size-4" /> Advanced Styling
        </summary>
        <div className="mt-4 space-y-5">
          <Range
            label="Opacity"
            value={Math.round(settings.opacity * 100)}
            suffix="%"
            min={10}
            max={100}
            onChange={(v) => onChange({ opacity: v / 100 })}
          />
          <Range
            label="Letter spacing"
            value={settings.letterSpacing}
            min={-4}
            max={24}
            onChange={(v) => onChange({ letterSpacing: v })}
          />
          <Range
            label="Line spacing"
            value={Math.round(settings.lineHeight * 100)}
            suffix="%"
            min={90}
            max={220}
            onChange={(v) => onChange({ lineHeight: v / 100 })}
          />

          <div>
            <Toggle
              wide
              label="Text shadow"
              active={settings.shadow}
              onClick={() => onChange({ shadow: !settings.shadow })}
            >
              <span className="text-sm font-semibold">Text shadow</span>
            </Toggle>
            {settings.shadow ? (
              <div className="mt-3 space-y-4">
                <Range
                  label="Blur"
                  value={settings.shadowBlur}
                  min={0}
                  max={80}
                  onChange={(v) => onChange({ shadowBlur: v })}
                />
                <Range
                  label="Shadow opacity"
                  value={Math.round(settings.shadowOpacity * 100)}
                  suffix="%"
                  min={0}
                  max={100}
                  onChange={(v) => onChange({ shadowOpacity: v / 100 })}
                />
                <Range
                  label="Offset"
                  value={settings.shadowOffset}
                  min={0}
                  max={40}
                  onChange={(v) => onChange({ shadowOffset: v })}
                />
              </div>
            ) : null}
          </div>

          <div>
            <Toggle
              wide
              label="Text outline"
              active={settings.outline}
              onClick={() => onChange({ outline: !settings.outline })}
            >
              <span className="text-sm font-semibold">Text outline</span>
            </Toggle>
            {settings.outline ? (
              <div className="mt-3 space-y-4">
                <Range
                  label="Thickness"
                  value={settings.outlineWidth}
                  min={1}
                  max={20}
                  onChange={(v) => onChange({ outlineWidth: v })}
                />
                <label className="flex items-center justify-between text-sm">
                  Outline color
                  <input
                    type="color"
                    value={settings.outlineColor}
                    onChange={(e) => onChange({ outlineColor: e.target.value })}
                    className="tile-skeu size-8 rounded-lg p-1"
                  />
                </label>
              </div>
            ) : null}
          </div>

          <Field label="Text background">
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  { v: "none", l: "None" },
                  { v: "solid", l: "Solid" },
                  { v: "translucent", l: "Translucent" },
                ] as const
              ).map((b) => (
                <Toggle
                  key={b.v}
                  label={b.l}
                  active={settings.background === b.v}
                  onClick={() => onChange({ background: b.v as BackgroundMode })}
                >
                  <span className="text-xs font-semibold">{b.l}</span>
                </Toggle>
              ))}
            </div>
            {settings.background !== "none" ? (
              <div className="mt-3 space-y-4">
                <label className="flex items-center justify-between text-sm">
                  Background color
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => onChange({ backgroundColor: e.target.value })}
                    className="tile-skeu size-8 rounded-lg p-1"
                  />
                </label>
                {settings.background === "translucent" ? (
                  <Range
                    label="Background opacity"
                    value={Math.round(settings.backgroundOpacity * 100)}
                    suffix="%"
                    min={5}
                    max={100}
                    onChange={(v) => onChange({ backgroundOpacity: v / 100 })}
                  />
                ) : null}
                <Range
                  label="Corner radius"
                  value={settings.backgroundRadius}
                  min={0}
                  max={80}
                  onChange={(v) => onChange({ backgroundRadius: v })}
                />
                <Range
                  label="Padding"
                  value={settings.backgroundPadding}
                  min={0}
                  max={90}
                  onChange={(v) => onChange({ backgroundPadding: v })}
                />
              </div>
            ) : null}
          </Field>
        </div>
      </details>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}

function Range({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className="tile-skeu rounded-md px-2 py-0.5 text-xs">
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <Slider min={min} max={max} value={[value]} onValueChange={(v) => onChange(v[0] ?? value)} />
    </div>
  );
}

function Toggle({
  label,
  active,
  onClick,
  children,
  wide,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-9 items-center justify-center gap-2 rounded-lg transition-all",
        wide && "w-full",
        active ? "well-skeu text-primary" : "tile-skeu hover:brightness-[1.02]",
      )}
    >
      {children}
    </button>
  );
}
