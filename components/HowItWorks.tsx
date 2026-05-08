const STEPS = [
  {
    n: '01',
    title: 'Turn on your webcam',
    body: 'Visionaryth observes from your device — nothing recorded, nothing uploaded, nothing leaves your computer.',
  },
  {
    n: '02',
    title: 'We track posture, distance, and blink rate',
    body: 'On-device computer vision watches the three habits most linked to myopia progression — in real time.',
  },
  {
    n: '03',
    title: 'You get gentle, real-time nudges',
    body: 'A subtle prompt when you slouch, lean too close, or stop blinking. No popups. No guilt-tripping.',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      data-testid="how-it-works"
      className="w-full px-6 py-24 sm:px-12 md:px-20"
    >
      <div className="mx-auto max-w-7xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">How it works</h2>
        <p className="mt-3 max-w-2xl text-base text-black/70 sm:text-lg">
          A coach that lives in your camera, not in the cloud.
        </p>
        <ol className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map((s) => (
            <li
              key={s.n}
              className="rounded-3xl bg-white/60 p-8 shadow-sm ring-1 ring-black/5"
            >
              <div className="font-mono text-sm font-semibold text-[var(--color-accent)]">
                {s.n}
              </div>
              <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
              <p className="mt-3 text-base text-black/70">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
