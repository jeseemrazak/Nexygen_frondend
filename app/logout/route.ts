import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// POST-only, deliberately: GET requests are prefetched by <Link> (and can be triggered
// by crawlers/browsers speculatively), so a GET handler here would silently log users
// out the moment the "Log Out" link rendered anywhere on the page.
export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('nexygen_token');
  return NextResponse.redirect(new URL('/login', request.url), { status: 303 });
}
