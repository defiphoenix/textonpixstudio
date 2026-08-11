export function AbstractBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-40 top-10 h-[36rem] w-[36rem] rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -right-32 top-1/3 h-[30rem] w-[30rem] rounded-full bg-accent/70 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-3xl" />
      <svg
        className="absolute left-0 bottom-24 h-40 w-72 text-primary/25"
        viewBox="0 0 200 100"
        fill="currentColor"
      >
        {Array.from({ length: 8 }).map((_, r) =>
          Array.from({ length: 18 }).map((__, c) => (
            <circle key={`${r}-${c}`} cx={4 + c * 11} cy={4 + r * 12} r="2" />
          )),
        )}
      </svg>
    </div>
  );
}