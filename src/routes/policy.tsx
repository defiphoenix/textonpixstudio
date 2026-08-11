import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Prose } from "@/components/PageShell";

const title = "Content & Acceptable Use Policy — TextPix";
const description =
  "What you can and cannot upload or create with TextPix, how we handle reports, and how enforcement and appeals work.";

export const Route = createFileRoute("/policy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Policy,
});

function Policy() {
  return (
    <PageShell
      title="Content policy"
      intro="TextPix is a creative tool. These rules cover what may be uploaded, saved or shared through it."
    >
      <Prose>
        <h2>Not allowed</h2>
        <ul>
          <li>Sexual content involving minors, or any content that exploits or endangers children.</li>
          <li>Harassment, threats, or hate speech targeting people or protected groups.</li>
          <li>Images or text that infringe someone else's copyright or trademark.</li>
          <li>Private information about others shared without consent.</li>
          <li>Deceptive edits presented as authentic news or evidence.</li>
        </ul>
        <h2>Copyright and fonts</h2>
        <p>
          Fonts offered in the editor are licensed for use in exported images. You are responsible
          for holding the rights to any photo you upload.
        </p>
        <h2>Reporting</h2>
        <p>
          Report a violation to support@textpix.app with a link or description. We review reports and
          remove content that breaks this policy.
        </p>
        <h2>Enforcement and appeals</h2>
        <p>
          Depending on severity we may remove content, limit features or suspend an account. If you
          believe an action was a mistake, reply to the notice and we will take another look.
        </p>
      </Prose>
    </PageShell>
  );
}