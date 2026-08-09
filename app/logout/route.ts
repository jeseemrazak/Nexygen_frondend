import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST-only, deliberately: GET requests are prefetched by <Link> (and can be triggered
// by crawlers/browsers speculatively), so a GET handler here would silently log users
// out the moment the "Log Out" link rendered anywhere on the page.
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('nexygen_token');

  // Don't trust request.url for the redirect target — behind the VPS's reverse proxy it
  // resolves to the internal upstream address (localhost), not the public host the browser
  // is actually on. The Host header (or X-Forwarded-Host, if there's a further proxy hop)
  // reflects what the browser really sent.
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
  const base = host ? `${proto}://${host}` : request.url;

  return NextResponse.redirect(new URL('/login', base), { status: 303 });
}
