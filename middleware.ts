import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the user has the digital ID badge in their cookies
  const token = request.cookies.get('nexygen_token');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // Don't trust request.url for the redirect target — it can resolve to an internal/upstream
  // host rather than the public one the browser is actually on. The Host header (or
  // X-Forwarded-Host, if there's a proxy hop) reflects what the browser really sent.
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol.replace(':', '');
  const base = host ? `${proto}://${host}` : request.url;

  // If they have NO token and are NOT on the login page, kick them out
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', base));
  }

  // If they HAVE a token and try to go to the login page, send them to the dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', base));
  }

  return NextResponse.next();
}

// Tell the guard which rooms to protect (Exclude static files and images) — this must also
// cover files served straight out of /public (nexygen-logo.png, etc.), not just _next's own
// assets, otherwise an unauthenticated request for the logo gets redirected to /login (HTML)
// instead of the image, breaking it on the login page itself.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)'],
};