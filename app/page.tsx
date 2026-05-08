import Hero from '@/components/Hero';
import StickyNav from '@/components/StickyNav';
import HowItWorks from '@/components/HowItWorks';
import WhyItMatters from '@/components/WhyItMatters';
import WaitlistForm from '@/components/WaitlistForm';

export default function HomePage() {
  return (
    <main>
      <Hero />
      <StickyNav />
      <HowItWorks />
      <WhyItMatters />
      <WaitlistForm />
    </main>
  );
}
