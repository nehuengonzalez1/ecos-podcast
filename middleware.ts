import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { CLERK_ACTIVE } from '@/lib/env'

const isProtectedRoute = createRouteMatcher(['/cuenta(.*)', '/admin(.*)'])

const clerkGuarded = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect()
})

export default function middleware(req: NextRequest, event: any) {
  if (!CLERK_ACTIVE) return NextResponse.next()
  return (clerkGuarded as any)(req, event)
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
