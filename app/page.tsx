import Hero from '@/components/Hero';

export default function HomePage() {
  return (
    <main>
      <Hero />

      <nav data-testid="sticky-nav" className="sticky top-0 z-40 h-16 w-full" />
      <section id="how-it-works" data-testid="how-it-works" className="min-h-screen" />
      <section id="why-it-matters" data-testid="why-it-matters" className="min-h-screen" />
      <section id="waitlist" data-testid="waitlist" className="min-h-[50vh]" />
    </main>
  );
}
