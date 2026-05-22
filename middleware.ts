import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin and /api routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return new NextResponse('Authentication Required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Secure CMS Area"',
        },
      });
    }

    try {
      const authValue = authHeader.split(' ')[1];
      const decoded = atob(authValue);
      const [username, password] = decoded.split(':');

      const expectedUser = process.env.ADMIN_USER || 'admin';
      const expectedPass = process.env.ADMIN_PASS || 'luxe2026';

      if (username === expectedUser && password === expectedPass) {
        return NextResponse.next();
      }
    } catch (e) {
      // Decode failed
    }

    return new NextResponse('Invalid Credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Secure CMS Area"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
