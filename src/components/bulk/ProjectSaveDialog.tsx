import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ProjectSaveDialog({
  defaultName,
  onSave,
  disabled,
}: {
  defaultName: string;
  onSave: (name: string) => Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="tile" className="h-10 rounded-xl" disabled={!!disabled}>
          <FolderPlus /> Save project
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Save this bulk project</DialogTitle>
          <DialogDescription>
            Stores your text items, prompt and design settings so you can reopen them later.
          </DialogDescription>
        </DialogHeader>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Motivational Quotes — September"
          aria-label="Project name"
        />
        <DialogFooter>
          <Button variant="tile" className="h-10 rounded-xl" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="hero"
            disabled={saving || !name.trim()}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(name.trim());
                setOpen(false);
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
