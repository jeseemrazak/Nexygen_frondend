import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { API_BASE_URL } from '@/lib/config';

// The backend now requires an auth token to read /uploads/* (they contain business data —
// logos, delivery signatures). Plain <img>/<a> tags can't attach an Authorization header, so
// this route proxies the request server-side using the caller's own session cookie instead of
// putting the raw token in an image URL.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  if (path.some((segment) => segment.includes('..'))) {
    return new NextResponse('Not found', { status: 404 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('nexygen_token')?.value;
  if (!token) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const upstream = await fetch(`${API_BASE_URL}/uploads/${path.join('/')}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse(null, { status: upstream.status });
  }

  const headers = new Headers();
  const contentType = upstream.headers.get('content-type');
  if (contentType) headers.set('content-type', contentType);

  return new NextResponse(upstream.body, { status: 200, headers });
}
