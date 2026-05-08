import Logo from './Logo';

export default function StickyNav() {
  return (
    <nav
      data-testid="sticky-nav"
      className="fixed top-0 z-40 w-full backdrop-blur"
      style={{ background: 'color-mix(in srgb, var(--color-bg) 80%, transparent)' }}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <a href="#hero" aria-label="Visionaryth home" className="flex items-center">
          <Logo className="h-8 w-auto" />
        </a>
        <a
          href="#waitlist"
          data-testid="nav-cta"
          className="rounded-full bg-[var(--color-accent)] px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Join Waitlist
        </a>
      </div>
    </nav>
  );
}
