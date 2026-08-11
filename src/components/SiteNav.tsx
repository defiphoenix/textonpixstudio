import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";

const links = ["Home", "Features", "Templates", "Fonts", "Pricing", "About"];

export function SiteNav() {
  return (
    <header className="flex flex-wrap items-center gap-4 px-2 py-2">
      <a href="#" className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] shadow-[var(--shadow-raised)]">
          <Type className="size-5 text-primary-foreground" />
        </span>
        <span className="leading-tight">
          <span className="block text-xl font-extrabold">
            Text<span className="text-primary">Pix</span>
          </span>
          <span className="block text-xs text-muted-foreground">Image Text Editor</span>
        </span>
      </a>

      <nav className="mx-auto hidden items-center gap-1 md:flex">
        {links.map((l, i) => (
          <a
            key={l}
            href="#"
            className={
              i === 0
                ? "well-skeu rounded-full px-5 py-2 text-sm font-semibold text-primary"
                : "rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {l}
          </a>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-3 md:ml-0">
        <Button variant="tile" className="h-10 rounded-xl px-5">
          Log in
        </Button>
        <Button variant="hero" className="h-10 px-5">
          Sign up
        </Button>
      </div>
    </header>
  );
}