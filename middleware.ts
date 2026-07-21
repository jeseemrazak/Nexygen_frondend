import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check if the user has the digital ID badge in their cookies
  const token = request.cookies.get('nexygen_token');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // If they have NO token and are NOT on the login page, kick them out
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If they HAVE a token and try to go to the login page, send them to the dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// Tell the guard which rooms to protect (Exclude static files and images)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};