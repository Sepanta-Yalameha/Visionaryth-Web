const STATS = [
  { n: '50%', label: 'projected global myopia rate by 2050' },
  { n: '7+ hrs', label: 'average daily screen time among teens' },
  { n: '↓50%', label: 'blink rate drop while staring at screens' },
];

export default function WhyItMatters() {
  return (
    <section
      id="why-it-matters"
      data-testid="why-it-matters"
      className="w-full px-6 py-24 sm:px-12 md:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Why it matters
        </h2>
        <p className="mt-4 max-w-2xl text-base text-black/70 sm:text-lg">
          Myopia is rising fastest in the generation that grew up on screens. Habits formed
          today shape how their eyes develop tomorrow — Visionaryth is for that window.
        </p>

        <dl className="mt-12 grid gap-6 sm:grid-cols-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-3xl bg-[var(--color-accent)] p-8 text-black"
            >
              <dt className="text-4xl font-bold sm:text-5xl">{s.n}</dt>
              <dd className="mt-3 text-base font-medium">{s.label}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-10 max-w-3xl text-sm text-black/60">
          Stats above are illustrative; final numbers will be sourced before launch.
        </p>
      </div>
    </section>
  );
}
