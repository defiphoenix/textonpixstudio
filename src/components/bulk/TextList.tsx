import { ArrowDown, ArrowUp, Copy, Plus, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { TextItem } from "@/lib/bulk/types";

export function TextList({
  items,
  onChange,
  onRegenerateOne,
  busy,
}: {
  items: TextItem[];
  onChange: (next: TextItem[]) => void;
  onRegenerateOne?: (id: string) => void;
  busy?: boolean;
}) {
  const patch = (id: string, text: string) =>
    onChange(items.map((i) => (i.id === id ? { ...i, text } : i)));

  const move = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(index, 1);
    next.splice(to, 0, item!);
    onChange(next);
  };

  if (!items.length) return null;

  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {items.length} text item{items.length === 1 ? "" : "s"}
        </p>
        <Button
          variant="tile"
          className="h-9 rounded-xl"
          onClick={() => onChange([...items, { id: crypto.randomUUID(), text: "" }])}
        >
          <Plus /> Add text
        </Button>
      </div>
      <ul className="well-skeu max-h-80 space-y-2 overflow-auto rounded-xl p-3">
        {items.map((item, i) => (
          <li key={item.id} className="flex items-start gap-2">
            <span className="mt-2 w-8 shrink-0 text-right text-xs text-muted-foreground">{i + 1}</span>
            <textarea
              value={item.text}
              rows={1}
              onChange={(e) => patch(item.id, e.target.value)}
              className="tile-skeu min-h-9 w-full resize-y rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex shrink-0 gap-1">
              <IconBtn label="Move up" onClick={() => move(i, -1)}>
                <ArrowUp className="size-3.5" />
              </IconBtn>
              <IconBtn label="Move down" onClick={() => move(i, 1)}>
                <ArrowDown className="size-3.5" />
              </IconBtn>
              <IconBtn
                label="Copy text"
                onClick={() => {
                  void navigator.clipboard.writeText(item.text);
                  toast.success("Copied");
                }}
              >
                <Copy className="size-3.5" />
              </IconBtn>
              {onRegenerateOne ? (
                <IconBtn label="Regenerate text" disabled={!!busy} onClick={() => onRegenerateOne(item.id)}>
                  <RefreshCw className="size-3.5" />
                </IconBtn>
              ) : null}
              <IconBtn label="Delete text" onClick={() => onChange(items.filter((x) => x.id !== item.id))}>
                <Trash2 className="size-3.5 text-destructive" />
              </IconBtn>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  children,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="tile-skeu grid size-8 place-items-center rounded-lg disabled:opacity-50"
    >
      {children}
    </button>
  );
}
