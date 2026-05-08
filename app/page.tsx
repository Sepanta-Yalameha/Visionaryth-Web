export default function HomePage() {
  return (
    <main>
      <section
        id="hero"
        data-testid="hero"
        className="relative w-full overflow-hidden"
        style={{ height: '100svh' }}
      >
        <h1 className="absolute left-8 top-1/3 text-5xl font-bold">Visionaryth</h1>
      </section>

      <nav data-testid="sticky-nav" className="sticky top-0 z-40 h-16 w-full" />
      <section id="how-it-works" data-testid="how-it-works" className="min-h-screen" />
      <section id="why-it-matters" data-testid="why-it-matters" className="min-h-screen" />
      <section id="waitlist" data-testid="waitlist" className="min-h-[50vh]" />
    </main>
  );
}
