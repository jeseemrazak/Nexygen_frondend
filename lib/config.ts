// The IP is a deliberate workaround, not a placeholder — see the comment in app/login/page.tsx
// ("prevent Node network routing bugs"). Override via NEXT_PUBLIC_API_URL for other environments.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://187.127.117.99:3002';

export function getClientToken(): string | null {
  const match = document.cookie.match(/(?:^|; )nexygen_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}
