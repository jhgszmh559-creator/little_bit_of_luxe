import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exclude automated webhooks from basic auth protection
  if (
    pathname.startsWith('/api/news-ingest') || 
    pathname.startsWith('/api/email-ingest') || 
    pathname.startsWith('/api/text-ingest')
  ) {
    return NextResponse.next();
  }

  // Only protect /admin and /api routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
    const authHeader = request.headers.get('authorization');

    // Detect if this is a Next.js client-side prefetch or RSC data request
    const isPrefetch = 
      request.headers.get('x-middleware-prefetch') === '1' ||
      request.headers.get('next-router-prefetch') === '1' ||
      request.headers.get('purpose') === 'prefetch' ||
      request.headers.has('rsc');

    if (!authHeader) {
      // If it's a prefetch, return 401 without the WWW-Authenticate header to prevent browser dialog popup
      if (isPrefetch) {
        return new NextResponse('Authentication Required', { status: 401 });
      }
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

    if (isPrefetch) {
      return new NextResponse('Invalid Credentials', { status: 401 });
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
