import Hero from '@/components/Hero';
import StickyNav from '@/components/StickyNav';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StickyNav />
      <section id="how-it-works" data-testid="how-it-works" className="min-h-screen" />
      <section id="why-it-matters" data-testid="why-it-matters" className="min-h-screen" />
      <section id="waitlist" data-testid="waitlist" className="min-h-[50vh]" />
    </main>
  );
}
