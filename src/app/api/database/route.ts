import { NextRequest, NextResponse } from 'next/server'
import { DatabaseSetup } from '@/lib/database-setup'

export async function POST(req: NextRequest) {
  try {
    const { action, email, name } = await req.json()

    // Basic authentication check (you should implement proper auth)
    const authHeader = req.headers.get('authorization')
    const adminSecret = process.env.ADMIN_SECRET
    
    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    switch (action) {
      case 'setup':
        await DatabaseSetup.setupDatabase()
        return NextResponse.json({ success: true, message: 'Database setup completed' })

      case 'verify':
        const isValid = await DatabaseSetup.verifySetup()
        return NextResponse.json({ success: isValid, verified: isValid })

      case 'stats':
        const stats = await DatabaseSetup.getStats()
        return NextResponse.json({ success: true, stats })

      case 'create-test-user':
        if (!email) {
          return NextResponse.json(
            { error: 'Email is required for creating test user' },
            { status: 400 }
          )
        }
        const userId = await DatabaseSetup.createTestUser(email, name)
        return NextResponse.json({ 
          success: true, 
          message: 'Test user created',
          userId 
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    console.error('Database management API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const stats = await DatabaseSetup.getStats()
    const isValid = await DatabaseSetup.verifySetup()
    
    return NextResponse.json({
      status: 'Database Management API',
      verified: isValid,
      stats,
      availableActions: [
        'setup',
        'verify', 
        'stats',
        'create-test-user'
      ]
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get database status' },
      { status: 500 }
    )
  }
}
