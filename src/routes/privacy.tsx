import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Prose } from "@/components/PageShell";

const title = "Privacy Policy — TextPix Image Text Editor";
const description =
  "How TextPix handles your photos, account details and saved edits: local-first editing, private storage and how to delete your data.";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <PageShell
      title="Privacy policy"
      intro="We keep this short and plain: your photos are yours, and we store as little as possible."
    >
      <Prose>
        <h2>Editing happens in your browser</h2>
        <p>
          When you upload a photo to the editor it is loaded directly in your browser. Nothing is
          uploaded to our servers unless you sign in and choose to save an edit.
        </p>
        <h2>What we store when you have an account</h2>
        <ul>
          <li>Your email address (and name/avatar if you sign in with Google).</li>
          <li>Edits you explicitly save: the image file plus your text and style settings.</li>
        </ul>
        <h2>Who can see your files</h2>
        <p>
          Saved images live in a private storage area scoped to your account. Access rules allow only
          your signed-in account to read, change or delete them. We do not sell or share your images.
        </p>
        <h2>Cookies and local storage</h2>
        <p>
          We use local storage to keep you signed in. There are no advertising or cross-site tracking
          cookies.
        </p>
        <h2>Deleting your data</h2>
        <p>
          Delete individual edits from My Edits at any time — the image file is removed along with
          the record. To remove your whole account, contact support@textpix.app.
        </p>
        <h2>Changes</h2>
        <p>
          If this policy changes materially we will note it on this page. Questions:
          support@textpix.app.
        </p>
      </Prose>
    </PageShell>
  );
}