import { NextRequest } from 'next/server';
import { waitlistSchema } from '@/lib/waitlist-schema';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ ok: false, error: 'invalid_email' }, { status: 400 });
  }
  // Backend integration is deferred. See CLAUDE.md.
  console.log('[waitlist:stub]', parsed.data.email);
  return Response.json({ ok: true, stub: true });
}
