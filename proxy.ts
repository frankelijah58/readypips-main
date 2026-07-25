import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';


export function proxy(request: NextRequest) {
   if (request.nextUrl.pathname.startsWith('/api/webhooks/whop')) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Get the pathname of the request (e.g. /, /protected, /api/auth)
  const path = request.nextUrl.pathname;

  // Define protected routes
  const protectedRoutes = [
    '/charts',
    '/dashboard',
    '/signals',
    '/news',
    '/insights',
    '/subscription',
    '/profile',
  ];

  // Define auth routes (login, register, etc.)
  const authRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ];

  // Check if the URL starts with /ref/
  if (pathname.startsWith('/ref/')) {
    const segments = pathname.split('/');
    const refCode = segments[segments.length - 1]; // Get 'rp-98fd17'

    if (refCode) {
      // Create a redirect response to the register page
      const response = NextResponse.redirect(new URL('/register', request.url));

      // Set the cookie in the response object
      response.cookies.set('refereer_code', refCode, {
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
        httpOnly: false, // Set to false so your Client Component can read it
        sameSite: 'lax',
      });

      return response;
    }
  }

  // For all other routes, continue
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/ref/:path*',
    '/((?!api/whop|api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
