import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { searchParams, pathname } = request.nextUrl
  const code = searchParams.get("code")

  // If there's a code param on any page (except auth/callback), redirect to auth/callback
  // This handles Supabase password reset / OAuth redirects that land on unexpected URLs
  if (code && pathname !== "/auth/callback") {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/callback"
    url.searchParams.set("code", code)
    if (pathname !== "/") {
      url.searchParams.set("next", pathname)
    }
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static assets and API routes
    "/((?!_next/static|_next/image|favicon.ico|api/|service-worker\\.js|logo/).*)",
  ],
}
