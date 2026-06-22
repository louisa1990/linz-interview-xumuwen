import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export interface SessionUser {
  id: string
  email: string
  role: string
}

/**
 * Get current session user
 */
export async function getSession(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return null
  }

  return {
    id: session.user.id,
    email: session.user.email as string,
    role: session.user.role as string
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession()

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * Require admin role - throws error if not admin
 */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth()

  if (user.role !== 'ADMIN') {
    throw new Error('Admin access required')
  }

  return user
}