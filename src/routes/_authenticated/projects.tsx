import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Project = {
  id: string;
  name: string;
  prompt: string;
  image_count: number;
  generated_count: number;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — TextPix Studio" },
      {
        name: "description",
        content: "Reopen your saved bulk text-on-image projects, prompts and design settings.",
      },
      { property: "og:title", content: "Projects — TextPix Studio" },
      { property: "og:description", content: "All your saved TextPix bulk projects in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const { data, error } = await supabase
        .from("bulk_projects")
        .select("id,name,prompt,image_count,generated_count,created_at")
        .order("created_at", { ascending: false });
      if (error) toast.error("Could not load your projects.");
      setProjects(data ?? []);
      setLoading(false);
    })();
  }, []);

  const remove = async (id: string) => {
    const { error } = await supabase.from("bulk_projects").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete that project.");
      return;
    }
    setProjects((p) => p.filter((x) => x.id !== id));
    toast.success("Project deleted");
  };

  return (
    <PageShell title="Projects" intro="Every bulk batch you saved, with its prompt and design settings.">
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="tile-skeu h-32 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : !projects.length ? (
        <div className="tile-skeu rounded-2xl p-8 text-center">
          <FolderOpen className="mx-auto size-6 text-primary" />
          <h2 className="mt-3 text-xl font-bold">No projects yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Save a batch from Bulk Create and it will show up here.
          </p>
          <Button variant="hero" className="mt-4" asChild>
            <Link to="/bulk-create">Start a bulk batch</Link>
          </Button>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id} className="tile-skeu rounded-2xl p-4">
              <h2 className="text-base font-bold">{p.name}</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(p.created_at).toLocaleDateString()} • {p.image_count} images •{" "}
                {p.generated_count} generated
              </p>
              {p.prompt ? (
                <p className="well-skeu mt-3 line-clamp-3 rounded-xl p-2.5 text-xs text-muted-foreground">
                  {p.prompt}
                </p>
              ) : null}
              <div className="mt-3 flex gap-2">
                <Button variant="tile" className="h-9 flex-1 rounded-xl" asChild>
                  <Link to="/bulk-create">Open Bulk Create</Link>
                </Button>
                <button
                  aria-label={`Delete ${p.name}`}
                  title="Delete project"
                  onClick={() => remove(p.id)}
                  className="tile-skeu grid size-9 place-items-center rounded-xl text-destructive"
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
