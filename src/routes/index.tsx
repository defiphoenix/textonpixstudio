import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Download, Layers, Palette, Type } from "lucide-react";
import { AbstractBackground } from "@/components/AbstractBackground";
import { Editor } from "@/components/Editor";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";

const title = "TextPix — Add Beautiful Text to Your Photos";
const description =
  "Upload a photo, add text in 100+ fonts and styles, and export eye-catching visuals in seconds. No sign up required.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Index,
});

const features = [
  {
    icon: Type,
    title: "Multiple Fonts",
    body: "Choose from beautiful display, serif and script fonts for your text.",
  },
  {
    icon: Palette,
    title: "Custom Styles",
    body: "Adjust colors, shadows, alignment, weight and more.",
  },
  {
    icon: Layers,
    title: "Easy to Use",
    body: "Drag your text anywhere on the canvas. No learning curve.",
  },
  {
    icon: Download,
    title: "High Quality Export",
    body: "Download your image at full original resolution.",
  },
];

function Index() {
  return (
    <>
      <AbstractBackground />
      <div className="mx-auto w-full max-w-7xl px-1 py-3 sm:px-2 sm:py-4">
        <div className="panel-skeu rounded-[2rem] p-2 sm:p-4">
          <SiteNav />

          <main className="mt-5 grid items-center gap-8 lg:grid-cols-[minmax(0,26rem)_1fr]">
            <section>
              <h1 className="text-5xl font-extrabold leading-[1.05] sm:text-6xl">
                Add Beautiful Text to Your{" "}
                <span className="text-gradient-primary">Images</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
                Upload your photo, add text in stunning fonts and styles, and create eye-catching
                visuals in seconds.
              </p>
              <div className="mt-8">
                <Button variant="hero" size="xl" asChild>
                  <a href="#editor">
                    Start Editing Now <Download />
                  </a>
                </Button>
              </div>
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="size-4 text-primary" /> No sign up required
              </p>
            </section>

            <section id="editor" className="scroll-mt-8">
              <Editor />
            </section>
          </main>

          <section id="features" className="mt-6 grid scroll-mt-8 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article key={f.title} className="tile-skeu rounded-2xl p-5">
                <span className="mb-3 grid size-11 place-items-center rounded-xl bg-accent shadow-[var(--shadow-inset)]">
                  <f.icon className="size-5 text-primary" />
                </span>
                <h2 className="text-base font-bold">{f.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </article>
            ))}
          </section>

          <SiteFooter />
        </div>
      </div>
    </>
  );
}
