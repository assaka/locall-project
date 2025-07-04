import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendLowBalanceAlert } from '@/lib/email'

export async function POST(req: NextRequest) {
  try {
    // Verify this is a valid cron request (you might want to add authentication)
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find users with low balances who haven't received alerts recently
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // Get users whose balance is at or below their threshold
    const { data: lowBalanceUsers, error: usersError } = await supabaseAdmin
      .rpc('get_low_balance_users')

    if (usersError) {
      console.error('Error fetching low balance users:', usersError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    if (!lowBalanceUsers || lowBalanceUsers.length === 0) {
      return NextResponse.json({
        message: 'No users with low balance found',
        processed: 0
      })
    }

    let alertsSent = 0
    let errors = 0

    for (const user of lowBalanceUsers) {
      try {
        // Check if user has received an alert in the last 24 hours
        const { data: recentAlert } = await supabaseAdmin
          .from('balance_alerts')
          .select('*')
          .eq('user_id', user.id)
          .gte('created_at', twentyFourHoursAgo)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (recentAlert) {
          console.log(`User ${user.id} already received alert recently, skipping`)
          continue
        }

        // Create alert record
        const { data: alertData, error: alertError } = await supabaseAdmin
          .from('balance_alerts')
          .insert({
            user_id: user.id,
            balance_at_trigger: user.wallet_balance,
            threshold: user.low_balance_threshold,
            email_sent: false
          })
          .select()
          .single()

        if (alertError) {
          console.error(`Failed to create alert for user ${user.id}:`, alertError)
          errors++
          continue
        }

        // Send email alert
        try {
          await sendLowBalanceAlert({
            userId: user.id,
            currentBalance: user.wallet_balance,
            threshold: user.low_balance_threshold,
            userEmail: user.email,
            userName: user.full_name
          })

          // Mark email as sent
          await supabaseAdmin
            .from('balance_alerts')
            .update({ email_sent: true })
            .eq('id', alertData.id)

          alertsSent++
          console.log(`Low balance alert sent to user ${user.id} (${user.email})`)
        } catch (emailError) {
          console.error(`Failed to send email to user ${user.id}:`, emailError)
          errors++
        }
      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        errors++
      }
    }

    return NextResponse.json({
      message: 'Balance monitoring completed',
      totalUsers: lowBalanceUsers.length,
      alertsSent,
      errors
    })

  } catch (error) {
    console.error('Balance monitoring cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Balance monitoring cron endpoint',
    description: 'Use POST method to trigger balance monitoring'
  })
}
