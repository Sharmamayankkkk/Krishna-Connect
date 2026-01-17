import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { cookies } from "next/headers"

export const createClient = () => {
  const cookieStore = cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      async get(name: string) {
        try {
          return (await cookieStore).get(name)?.value
        } catch (error) {
          console.error("Error getting cookie:", error)
          return undefined
        }
      },
      async set(name: string, value: string, options: CookieOptions) {
        try {
          (await cookieStore).set({ name, value, ...options })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          console.error("Error setting cookie:", error)
        }
      },
      async remove(name: string, options: CookieOptions) {
        try {
          (await cookieStore).set({ name, value: '', ...options })
        } catch (error) {
          // The `delete` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          console.error("Error removing cookie:", error)
        }
      },
    },
    auth: {
        persistSession: false
    }
  })
}
