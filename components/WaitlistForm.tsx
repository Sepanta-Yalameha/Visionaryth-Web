'use client';

import { useState } from 'react';
import { waitlistSchema } from '@/lib/waitlist-schema';

type Status = 'idle' | 'submitting' | 'success' | 'error';

export default function WaitlistForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsed = waitlistSchema.safeParse({ email });
    if (!parsed.success) {
      setStatus('error');
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        setStatus('error');
        setErrorMsg('Something went wrong. Please try again.');
        return;
      }
      setStatus('success');
      setEmail('');
    } catch {
      setStatus('error');
      setErrorMsg('Network error. Please try again.');
    }
  };

  return (
    <section
      id="waitlist"
      data-testid="waitlist"
      className="flex w-full min-h-screen flex-col justify-start px-6 pt-12 pb-24 sm:px-12 md:px-20"
    >
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Be first in line
        </h2>
        <p className="mt-4 text-base text-black/70 sm:text-lg">
          Join the waitlist and we&apos;ll let you know the moment Visionaryth opens up.
        </p>

        {status === 'success' ? (
          <p
            data-testid="waitlist-success"
            role="status"
            className="mt-10 inline-flex rounded-full bg-[var(--color-accent)] px-6 py-3 text-base font-medium text-black"
          >
            You&apos;re on the list. We&apos;ll be in touch.
          </p>
        ) : (
          <form
            onSubmit={onSubmit}
            data-testid="waitlist-form"
            noValidate
            className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center"
          >
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              data-testid="waitlist-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-full bg-white px-5 py-3 text-base ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] sm:w-80"
            />
            <button
              type="submit"
              data-testid="waitlist-submit"
              disabled={status === 'submitting'}
              className="rounded-full bg-[var(--color-accent)] px-6 py-3 text-base font-semibold text-black disabled:opacity-50"
            >
              {status === 'submitting' ? 'Joining…' : 'Join Waitlist'}
            </button>
          </form>
        )}
        {errorMsg && (
          <p data-testid="waitlist-error" role="alert" className="mt-4 text-sm text-red-700">
            {errorMsg}
          </p>
        )}
      </div>
    </section>
  );
}
