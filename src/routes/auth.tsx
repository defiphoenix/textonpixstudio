import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AbstractBackground } from "@/components/AbstractBackground";
import { SiteNav } from "@/components/SiteNav";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const title = "Sign in to TextPix — Save Your Text Edits";
const description =
  "Create a free TextPix account with Google or email to upload photos, save text overlays and revisit your edit history anytime.";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    mode: search['mode'] === "signup" ? ("signup" as const) : ("login" as const),
  }),
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === "signup";

  if (user) {
    return (
      <Shell>
        <p className="text-sm text-muted-foreground">
          You are signed in as {user.email}.
        </p>
        <Button variant="hero" className="mt-4" asChild>
          <Link to="/history">Go to my edits</Link>
        </Button>
      </Shell>
    );
  }

  const google = async () => {
    setError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/history" });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    if (isSignup) {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (err) setError(err.message);
      else if (!data.session) setMessage("Check your email to confirm your account.");
      else navigate({ to: "/history" });
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) setError(err.message);
      else navigate({ to: "/history" });
    }
    setBusy(false);
  };

  return (
    <Shell>
      <h1 className="text-3xl font-extrabold">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isSignup
          ? "Save your edits, keep your upload history and pick up where you left off."
          : "Sign in to access your saved edits and upload history."}
      </p>

      <Button variant="tile" className="mt-6 h-11 w-full rounded-xl" onClick={google}>
        Continue with Google
      </Button>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="well-skeu w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="well-skeu w-full rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : isSignup ? "Sign up" : "Log in"}
        </Button>
      </form>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-primary">{message}</p> : null}

      <p className="mt-6 text-sm text-muted-foreground">
        {isSignup ? "Already have an account? " : "New to TextPix? "}
        <Link
          to="/auth"
          search={{ mode: isSignup ? "login" : "signup" }}
          className="font-semibold text-primary"
        >
          {isSignup ? "Log in" : "Create one"}
        </Link>
      </p>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AbstractBackground />
      <div className="mx-auto w-full max-w-7xl px-1 py-3 sm:px-2 sm:py-4">
        <div className="panel-skeu rounded-[2rem] p-3 sm:p-4">
          <SiteNav />
          <main className="mx-auto my-10 w-full max-w-md">
            <div className="tile-skeu rounded-2xl p-6">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}