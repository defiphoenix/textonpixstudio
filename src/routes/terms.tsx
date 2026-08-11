import { createFileRoute } from "@tanstack/react-router";
import { PageShell, Prose } from "@/components/PageShell";

const title = "Terms of Service — TextPix";
const description =
  "The rules for using TextPix: your rights to your images, acceptable use, account responsibilities and service availability.";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <PageShell
      title="Terms of service"
      intro="By using TextPix you agree to the terms below. They exist to keep the service usable and safe for everyone."
    >
      <Prose>
        <h2>Your content stays yours</h2>
        <p>
          You keep all rights to the photos you upload and the images you export. You grant us only
          the technical permission needed to store and display saved edits back to you.
        </p>
        <h2>Your responsibilities</h2>
        <ul>
          <li>Only upload images you own or have permission to use.</li>
          <li>Keep your account credentials secure; you are responsible for activity on it.</li>
          <li>Do not attempt to disrupt, overload or reverse engineer the service.</li>
        </ul>
        <h2>Acceptable use</h2>
        <p>
          Content that is illegal, hateful, sexually exploitative or infringing is not allowed. See
          the content policy for details. We may remove content or suspend accounts that break these
          rules.
        </p>
        <h2>Availability</h2>
        <p>
          TextPix is provided as is, without warranties. Features may change and the service may be
          unavailable during maintenance. Keep your own copies of important exports.
        </p>
        <h2>Liability</h2>
        <p>
          To the extent permitted by law, we are not liable for indirect or incidental damages, or
          for loss of content you have not backed up yourself.
        </p>
        <h2>Contact</h2>
        <p>Questions about these terms: support@textpix.app.</p>
      </Prose>
    </PageShell>
  );
}