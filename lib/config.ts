// The IP is a deliberate workaround, not a placeholder — see the comment in app/login/page.tsx
// ("prevent Node network routing bugs"). Override via NEXT_PUBLIC_API_URL for other environments.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://187.127.117.99:3002';

export function getClientToken(): string | null {
  const match = document.cookie.match(/(?:^|; )nexygen_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// Uploaded files now require an auth token to fetch — plain <img>/<a> tags can't set an
// Authorization header, so route them through our own /api/uploads proxy instead of hitting
// the backend directly. Works the same whether `path` (e.g. "/uploads/logos/x.png") is read
// in a server component or a client component.
export function uploadUrl(path?: string | null): string {
  if (!path) return '';
  return `/api${path}`;
}

// A failed fetch's body isn't guaranteed to be well-formed JSON — an expired-token 401 can come
// back empty, a gateway timeout can return HTML. Calling res.json() directly on those throws a
// SyntaxError that's easy to leave uncaught, which was leaving "Saving..."/"Processing..."
// buttons stuck forever with no visible error. Use this instead of `await res.json()` on any
// error branch (or anywhere the shape isn't guaranteed).
export async function safeJson(res: Response): Promise<any> {
  try {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}
