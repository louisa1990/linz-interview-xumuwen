import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/utils'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    // Test both session methods
    const ourSession = await getSession()
    const nextAuthSession = await getServerSession(authOptions)

    return NextResponse.json({
      success: true,
      ourSession: ourSession || null,
      nextAuthSession: nextAuthSession || null,
      ourSessionExists: !!ourSession,
      nextAuthSessionExists: !!nextAuthSession,
      message: ourSession ? 'Our session works' : 'No session found'
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}