import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for static assets, next internals, and API routes (we'll handle API auth separately if needed)
  if (
    path.startsWith('/_next') ||
    path.startsWith('/api/') ||
    path.startsWith('/public/') ||
    path === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Define protected routes and their corresponding roles
  const protectedRoutes: Record<string, ('client' | 'freelancer' | 'admin')[]> = {
    '/client-dashboard': ['client'],
    '/freelancer': ['freelancer'],
    '/admin': ['admin'],
    // Add more specific protected routes as needed
  };

  // Check if the path is protected
  const requiredRoles = protectedRoutes[path];
  if (requiredRoles) {
    // For middleware running on server, we need to check cookies
    // In a real app with Next.js 14, we'd use NextAuth or similar
    // For this implementation, we'll rely on client-side auth via AuthenticatedLayout
    // But we can still do basic redirect for obvious cases

    // Since we're using client-side auth with localStorage,
    // the middleware can't reliably check auth state on server
    // So we'll let the AuthenticatedLayout handle client-side redirects
    // but we can still prevent access to obvious protected paths if no auth cookie

    // Check for auth cookie (if we had one set)
    const authCookie = request.cookies.get('artsy_auth_token') ||
                      request.cookies.get('next-auth.session-token') ||
                      request.cookies.get('__session');

    // If no auth cookie and trying to access protected route, redirect to login
    // Note: This is a simplification - in practice with localStorage auth,
    // we'd need to handle this differently or accept client-side redirects
    if (!authCookie && !path.startsWith('/auth/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
  }

  // Optional: Redirect root to login if not authenticated (handled client-side now)
  // We'll let the AuthenticatedLayout handle this for better UX

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - API routes (we handle those differently if needed)
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
};