import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

const links = [
  { to: "/", label: "Home" },
  { to: "/faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/policy", label: "Policy" },
] as const;

export function SiteNav() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="flex flex-wrap items-center gap-4 px-2 py-2">
      <Link to="/" className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-raised)]">
          <Type className="size-5 text-primary-foreground" />
        </span>
        <span className="leading-tight">
          <span className="block text-xl font-extrabold">
            Text<span className="text-primary">Pix</span>
          </span>
          <span className="block text-xs text-muted-foreground">Image Text Editor</span>
        </span>
      </Link>

      <nav className="mx-auto hidden items-center gap-1 md:flex">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={
              pathname === l.to
                ? "well-skeu rounded-full px-5 py-2 text-sm font-semibold text-primary"
                : "rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {l.label}
          </Link>
        ))}
        {user ? (
          <Link
            to="/history"
            className={
              pathname === "/history"
                ? "well-skeu rounded-full px-5 py-2 text-sm font-semibold text-primary"
                : "rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            My Edits
          </Link>
        ) : null}
      </nav>

      <div className="ml-auto flex items-center gap-3 md:ml-0">
        {loading ? null : user ? (
          <>
            <span className="hidden max-w-[12rem] truncate text-sm text-muted-foreground sm:block">
              {user.email}
            </span>
            <Button variant="tile" className="h-10 rounded-xl px-5" onClick={signOut}>
              Log out
            </Button>
          </>
        ) : (
          <>
            <Button variant="tile" className="h-10 rounded-xl px-5" asChild>
              <Link to="/auth" search={{ mode: "login" }}>
                Log in
              </Link>
            </Button>
            <Button variant="hero" className="h-10 px-5" asChild>
              <Link to="/auth" search={{ mode: "signup" }}>
                Sign up
              </Link>
            </Button>
          </>
        )}
      </div>
    </header>
  );
}