import { Link } from "@tanstack/react-router";

export const footerLinks = [
  { to: "/faq", label: "FAQ" },
  { to: "/privacy", label: "Privacy" },
  { to: "/terms", label: "Terms" },
  { to: "/policy", label: "Content Policy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
      <span>© {new Date().getFullYear()} TextPix — made for people who love good type.</span>
      <nav className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2">
        {footerLinks.map((l) => (
          <Link key={l.to} to={l.to} className="transition-colors hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </nav>
    </footer>
  );
}