import type { ReactNode } from "react";
import { AbstractBackground } from "@/components/AbstractBackground";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteNav } from "@/components/SiteNav";

export function PageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <>
      <AbstractBackground />
      <div className="mx-auto w-full max-w-7xl px-1 py-3 sm:px-2 sm:py-4">
        <div className="panel-skeu rounded-[2rem] p-3 sm:p-4">
          <SiteNav />
          <main className="mt-5">
            <header className="max-w-3xl">
              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">{title}</h1>
              {intro ? (
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{intro}</p>
              ) : null}
            </header>
            <div className="mt-6">{children}</div>
          </main>
          <SiteFooter />
        </div>
      </div>
    </>
  );
}

export function Prose({ children }: { children: ReactNode }) {
  return (
    <div className="tile-skeu max-w-3xl space-y-5 rounded-2xl p-6 text-sm leading-relaxed text-muted-foreground [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-foreground [&_li]:ml-5 [&_li]:list-disc">
      {children}
    </div>
  );
}