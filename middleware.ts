import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const authCookie = request.cookies.get('bi_auth');
    const path = request.nextUrl.pathname;

    const protectedRoutes = ['/', '/dashboard', '/admin', '/growth'];

    if (protectedRoutes.some(route => path === route || path.startsWith(`${route}/`)) && !authCookie?.value && path !== '/login') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (path === '/login') {
        if (authCookie?.value) {
            return NextResponse.redirect(new URL('/', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
