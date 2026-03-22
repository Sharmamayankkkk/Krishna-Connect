
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl

  // 0. Handle Supabase auth code redirects (password reset, OAuth)
  const code = searchParams.get("code")
  if (code && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/callback"
    url.searchParams.set("code", code)
    if (pathname !== "/") {
      url.searchParams.set("next", pathname)
    }
    return NextResponse.redirect(url)
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Check Maintenance Mode
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (isMaintenanceMode && pathname !== '/maintenance') {
    // Allow static assets/api if needed (already mostly covered by matcher, but safe to add)
    if (
      !pathname.startsWith('/_next') &&
      !pathname.startsWith('/static') &&
      !pathname.startsWith('/api')
    ) {
      // Check Bypass
      const bypassKey = process.env.MAINTENANCE_BYPASS_SECRET;
      const requestBypassKey = request.nextUrl.searchParams.get('bypass');
      const bypassCookie = request.cookies.get('maintenance_bypass');

      let allow = false;

      if (bypassKey && requestBypassKey === bypassKey) {
        allow = true;
        // Set cookie on the *current* response object which we might return or use later
        response.cookies.set('maintenance_bypass', 'true', {
          httpOnly: true,
          path: '/',
          sameSite: 'strict'
        });
      } else if (bypassCookie?.value === 'true') {
        allow = true;
      }

      if (!allow) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: "", ...options })
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()



  // Define public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/signup',
    '/forgot-password',
    '/update-password',
    '/auth/callback',
    '/terms-and-conditions',
    '/privacy-policy',
    '/sitemap.xml',
    '/contact-us',
    '/developers',
    '/faq',
    '/maintenance',
    '/site.webmanifest',
    '/directory',
    '/p/',
    '/about'
  ];

  // Check if the current path is a public route or an API/join route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
  if (isPublicRoute || pathname.startsWith('/api') || pathname.startsWith('/join/') || pathname.startsWith('/.well-known/')) {
    return response;
  }

  // If there's no session, redirect unauthenticated users to the login page
  if (!session) {
    // Allow access to public profile and post pages
    // Regex matches:
    // 1. /post/[id] (Redirect page)
    // 2. /profile/[username] (Profile page)
    // 3. /profile/[username]/post/[id] (Post page)
    const isProfilePage = /^\/profile\/[^\/]+$/.test(pathname);
    const isPostPage = /^\/profile\/[^\/]+\/post\/[^\/]+$/.test(pathname);
    const isRedirectPage = /^\/post\/[^\/]+$/.test(pathname);
    const isExplorePage = pathname === '/explore';
    const isHashtagPage = /^\/hashtag\/[^\/]+$/.test(pathname);
    const isHomePage = pathname === '/';

    if (isProfilePage || isPostPage || isRedirectPage || isExplorePage || isHashtagPage || isHomePage) {
      return response;
    }

    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('next', pathname) // Save the intended destination
    const redirectResponse = NextResponse.redirect(url)

    // Copy cookies from initial response to redirect response
    const allCookies = response.cookies.getAll()
    allCookies.forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie) // Use cookie options if needed, but value is key
    })

    return redirectResponse
  }

  // If there is a session, handle profile completion and other redirects
  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', session.user.id)
    .single();

  const isProfileComplete = profile && profile.username;

  // If profile is not complete, force redirect to complete-profile page
  if (!isProfileComplete && pathname !== '/complete-profile') {
    const redirectResponse = NextResponse.redirect(new URL('/complete-profile', request.url));

    // Copy cookies
    const allCookies = response.cookies.getAll()
    allCookies.forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return redirectResponse
  }

  // If profile is complete, redirect away from auth pages to the main app
  if (isProfileComplete && (pathname === '/login' || pathname === '/signup' || pathname === '/complete-profile')) {
    const redirectResponse = NextResponse.redirect(new URL('/explore', request.url));

    // Copy cookies
    const allCookies = response.cookies.getAll()
    allCookies.forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return redirectResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - and files with common image/asset extensions
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|ads.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|apk)|service-worker.js).*)"
  ],
}
