export function AbstractBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* soft organic blobs, mirroring the reference artwork */}
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 1536 1024"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-140 60C120 30 300 190 285 400c-14 200-210 250-190 430 18 160-120 210-260 190V60z"
          fill="oklch(0.72 0.09 250 / 0.28)"
        />
        <path
          d="M-160 180C60 170 200 300 190 460c-10 160-170 210-150 360 14 110-80 160-200 150V180z"
          fill="oklch(0.8 0.06 250 / 0.35)"
        />
        <path
          d="M1700 -40c-230 40-330 210-260 380 70 170 250 180 250 330 0 130 60 240 10 350h0V-40z"
          fill="oklch(0.74 0.08 248 / 0.25)"
        />
        <circle cx="1420" cy="120" r="180" fill="oklch(0.78 0.07 250 / 0.25)" />
        <circle cx="1360" cy="880" r="150" fill="oklch(0.8 0.06 252 / 0.3)" />
      </svg>

      <div className="absolute -left-32 top-16 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -right-24 top-1/3 h-[26rem] w-[26rem] rounded-full bg-primary/10 blur-3xl" />

      {/* dotted grid accents */}
      <svg
        className="absolute bottom-28 left-2 h-40 w-64 text-primary/25"
        viewBox="0 0 200 120"
        fill="currentColor"
      >
        {Array.from({ length: 9 }).map((_, r) =>
          Array.from({ length: 18 }).map((__, c) => (
            <circle key={`b-${r}-${c}`} cx={4 + c * 11} cy={4 + r * 13} r="2" />
          )),
        )}
      </svg>
      <svg
        className="absolute right-6 top-10 h-28 w-44 text-primary/20"
        viewBox="0 0 200 120"
        fill="currentColor"
      >
        {Array.from({ length: 7 }).map((_, r) =>
          Array.from({ length: 14 }).map((__, c) => (
            <circle key={`t-${r}-${c}`} cx={6 + c * 14} cy={6 + r * 17} r="2.4" />
          )),
        )}
      </svg>
    </div>
  );
}