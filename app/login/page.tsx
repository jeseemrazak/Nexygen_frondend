import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { API_BASE_URL } from '@/lib/config';

// We add searchParams to the page properties to read the URL (?error=true)
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const hasError = resolvedSearchParams.error === 'true';

  // The secure Server Action that talks to your backend
  async function handleLogin(formData: FormData) {
    'use server';
    
    const email = formData.get('email');
    const password = formData.get('password');

    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      // If the password is wrong, gently redirect back with an error flag
      redirect('/login?error=true');
    }
    
    const data = await res.json();

    // Wait for the cookie store to be ready
    const cookieStore = await cookies();
    
    // Give the user their Digital ID Badge (Secure Cookie)
    // httpOnly is intentionally false: several client components (order/purchase-order
    // creation, stock transfer, etc.) read this cookie directly to attach the bearer
    // token to their own fetch calls. This is an internal admin tool with no untrusted
    // user content rendered, so the XSS-token-theft tradeoff is acceptable here.
    //
    // secure is driven by an explicit COOKIE_SECURE env var, NOT NODE_ENV: `next start`
    // always forces NODE_ENV=production internally regardless of the shell environment,
    // which previously marked the cookie Secure even when served over plain HTTP —
    // browsers silently refuse to store/send a Secure cookie on a non-HTTPS origin,
    // so every navigation looked like an instant logout. Set COOKIE_SECURE=true once
    // this is actually served over HTTPS.
    cookieStore.set('nexygen_token', data.access_token, {
      httpOnly: false,
      secure: process.env.COOKIE_SECURE === 'true',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });

    // Unlock the doors and send them to the dashboard
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-teal-700">NEXYGEN ERP</h1>
          <p className="text-gray-500 mt-2 text-sm">NEXT GENERATION ERP Login</p>
        </div>

        <form action={handleLogin} className="space-y-5">
          
          {/* --- NEW: Error Banner --- */}
          {hasError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">
                    Invalid email or password. Please try again.
                  </p>
                </div>
              </div>
            </div>
          )}
          {/* ------------------------- */}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Email Address</label>
            <input 
              type="email" 
              name="email" 
              required 
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-teal-500 focus:border-teal-500 text-black"
              placeholder="admin@nexygen.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Password</label>
            <input 
              type="password" 
              name="password" 
              required 
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-teal-500 focus:border-teal-500 text-black"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-md transition-colors shadow-sm"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
}