import Hero from '@/components/Hero';
import StickyNav from '@/components/StickyNav';
import HowItWorks from '@/components/HowItWorks';
import WhyItMatters from '@/components/WhyItMatters';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StickyNav />
      <HowItWorks />
      <WhyItMatters />
      <section id="waitlist" data-testid="waitlist" className="min-h-[50vh]" />
    </main>
  );
}
