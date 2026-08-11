import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const title = "My Edits — TextPix Upload & Edit History";
const description =
  "Browse every photo you have uploaded to TextPix along with the text, fonts and styles you applied, and reopen any edit.";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: HistoryPage,
});

type EditRow = {
  id: string;
  title: string;
  image_path: string;
  text_content: string;
  font: string;
  font_size: number;
  created_at: string;
};

function HistoryPage() {
  const [rows, setRows] = useState<EditRow[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("edits")
      .select("id, title, image_path, text_content, font, font_size, created_at")
      .order("created_at", { ascending: false });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const list = (data ?? []) as EditRow[];
    setRows(list);
    const signed: Record<string, string> = {};
    await Promise.all(
      list.map(async (row) => {
        const { data: s } = await supabase.storage
          .from("edits")
          .createSignedUrl(row.image_path, 3600);
        if (s?.signedUrl) signed[row.id] = s.signedUrl;
      }),
    );
    setUrls(signed);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const remove = async (row: EditRow) => {
    await supabase.storage.from("edits").remove([row.image_path]);
    await supabase.from("edits").delete().eq("id", row.id);
    setRows((prev) => prev.filter((r) => r.id !== row.id));
  };

  return (
    <PageShell
      title="My edits"
      intro="Every photo you save from the editor lands here with its text and style settings."
    >
      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your history…</p>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : rows.length === 0 ? (
        <div className="tile-skeu max-w-xl rounded-2xl p-6">
          <h2 className="text-base font-bold">No saved edits yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Head to the editor, upload a photo, add your text and hit Save.
          </p>
          <Button variant="hero" className="mt-4" asChild>
            <Link to="/">Open the editor</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <li key={row.id} className="tile-skeu overflow-hidden rounded-2xl p-3">
              <div className="well-skeu aspect-[6/5] overflow-hidden rounded-xl">
                {urls[row.id] ? (
                  <img
                    src={urls[row.id]}
                    alt={`Saved edit: ${row.title}`}
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : null}
              </div>
              <div className="mt-3 flex items-start gap-2">
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">{row.title}</h2>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {row.text_content.replace(/\n/g, " · ") || "No text"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  aria-label={`Delete ${row.title}`}
                  onClick={() => void remove(row)}
                  className="tile-skeu ml-auto grid size-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}