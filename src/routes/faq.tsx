import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Prose } from "@/components/PageShell";

const title = "TextPix FAQ — Fonts, Uploads, Exports & Accounts";
const description =
  "Answers about supported image formats, fonts and styles, export quality, saved edit history and account requirements in TextPix.";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Faq,
});

const faqs = [
  {
    q: "Do I need an account to use the editor?",
    a: "No. You can upload a photo, add text and download the result without signing up. An account is only needed if you want your uploads and edits saved to your history.",
  },
  {
    q: "Which image formats can I upload?",
    a: "Any format your browser can display — JPG, PNG, WebP, GIF (first frame) and HEIC where the browser supports it. Files stay in your browser until you choose to save them.",
  },
  {
    q: "What fonts and styles are available?",
    a: "Script, serif, display and modern sans fonts, plus bold, italic, underline, colour, size, alignment and a soft drop shadow. Drag the text anywhere on the canvas.",
  },
  {
    q: "What quality is the exported image?",
    a: "Exports are rendered as PNG at the full original resolution of your uploaded photo, with the text scaled to match.",
  },
  {
    q: "Where are my saved edits stored?",
    a: "In your private storage area. Only your signed-in account can read those files, and you can delete any saved edit at any time from My Edits.",
  },
  {
    q: "How do I delete my account and data?",
    a: "Delete your saved edits from My Edits, then email support and we will remove your account and any remaining data.",
  },
];

function Faq() {
  return (
    <PageShell
      title="Frequently asked questions"
      intro="Everything about uploading photos, styling text and saving your work in TextPix."
    >
      <div className="grid max-w-4xl gap-3 sm:grid-cols-2">
        {faqs.map((f) => (
          <article key={f.q} className="tile-skeu rounded-2xl p-5">
            <h2 className="text-base font-bold">{f.q}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
          </article>
        ))}
      </div>
      <div className="mt-4">
        <Prose>
          <h2>Still stuck?</h2>
          <p>
            Write to support@textpix.app with a short description of what you were doing and the
            browser you use. We usually reply within two business days.
          </p>
        </Prose>
      </div>
    </PageShell>
  );
}