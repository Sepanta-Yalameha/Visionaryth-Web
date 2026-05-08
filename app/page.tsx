import Hero from '@/components/Hero';
import StickyNav from '@/components/StickyNav';
import HowItWorks from '@/components/HowItWorks';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StickyNav />
      <HowItWorks />
      <section id="why-it-matters" data-testid="why-it-matters" className="min-h-screen" />
      <section id="waitlist" data-testid="waitlist" className="min-h-[50vh]" />
    </main>
  );
}
