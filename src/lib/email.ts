import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import { BalanceAlert } from '@/types/database'

// Email service configuration
const useResend = !!process.env.RESEND_API_KEY
const resend = useResend ? new Resend(process.env.RESEND_API_KEY!) : null

// Nodemailer configuration
const transporter = !useResend ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null

/**
 * Send low balance alert email
 */
export async function sendLowBalanceAlert(alertData: BalanceAlert): Promise<void> {
  const { userEmail, userName, currentBalance, threshold } = alertData
  const companyName = process.env.COMPANY_NAME || 'Your Company'
  const fromEmail = process.env.FROM_EMAIL || 'noreply@yourcompany.com'
  
  // Generate top-up link (you can customize this URL)
  const topUpLink = `${process.env.NEXTAUTH_URL}/wallet/top-up`

  const subject = `Low Balance Alert - ${companyName}`
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .alert-box {
          background-color: #fff3cd;
          border: 1px solid #ffeaa7;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .balance-info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .cta-button {
          display: inline-block;
          background-color: #007bff;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyName}</h1>
        <h2>Low Balance Alert</h2>
      </div>

      <p>Hello ${userName || 'there'},</p>

      <div class="alert-box">
        <strong>⚠️ Your wallet balance is running low!</strong>
      </div>

      <div class="balance-info">
        <h3>Balance Summary:</h3>
        <ul>
          <li><strong>Current Balance:</strong> $${(currentBalance / 100).toFixed(2)}</li>
          <li><strong>Alert Threshold:</strong> $${(threshold / 100).toFixed(2)}</li>
        </ul>
      </div>

      <p>Your current balance has fallen below your set threshold. To continue using our services without interruption, please top up your wallet.</p>

      <a href="${topUpLink}" class="cta-button">Top Up Wallet Now</a>

      <p>You can also:</p>
      <ul>
        <li>View your transaction history</li>
        <li>Adjust your low balance threshold</li>
        <li>Set up automatic top-ups</li>
      </ul>

      <div class="footer">
        <p>This is an automated message from ${companyName}.</p>
        <p>If you have any questions, please contact our support team.</p>
      </div>
    </body>
    </html>
  `

  const textContent = `
    ${companyName} - Low Balance Alert

    Hello ${userName || 'there'},

    Your wallet balance is running low!

    Balance Summary:
    - Current Balance: $${(currentBalance / 100).toFixed(2)}
    - Alert Threshold: $${(threshold / 100).toFixed(2)}

    Your current balance has fallen below your set threshold. To continue using our services without interruption, please top up your wallet.

    Top up your wallet: ${topUpLink}

    This is an automated message from ${companyName}.
  `

  try {
    if (useResend && resend) {
      // Send via Resend
      await resend.emails.send({
        from: fromEmail,
        to: userEmail,
        subject,
        html: htmlContent,
        text: textContent,
      })
    } else if (transporter) {
      // Send via Nodemailer
      await transporter.sendMail({
        from: fromEmail,
        to: userEmail,
        subject,
        html: htmlContent,
        text: textContent,
      })
    } else {
      throw new Error('No email service configured')
    }

    console.log(`Low balance alert sent to ${userEmail}`)
  } catch (error) {
    console.error('Failed to send low balance alert:', error)
    throw error
  }
}

/**
 * Send transaction confirmation email
 */
export async function sendTransactionConfirmation(
  userEmail: string,
  userName: string | null,
  transactionType: 'top-up' | 'deduction',
  amount: number,
  newBalance: number,
  description: string
): Promise<void> {
  const companyName = process.env.COMPANY_NAME || 'Your Company'
  const fromEmail = process.env.FROM_EMAIL || 'noreply@yourcompany.com'
  
  const subject = `Transaction Confirmation - ${companyName}`
  const transactionTypeLabel = transactionType === 'top-up' ? 'Top-up' : 'Deduction'
  const amountFormatted = `$${(amount / 100).toFixed(2)}`
  const balanceFormatted = `$${(newBalance / 100).toFixed(2)}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .transaction-box {
          background-color: ${transactionType === 'top-up' ? '#d4edda' : '#f8d7da'};
          border: 1px solid ${transactionType === 'top-up' ? '#c3e6cb' : '#f5c6cb'};
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .balance-info {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          font-size: 14px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${companyName}</h1>
        <h2>Transaction Confirmation</h2>
      </div>

      <p>Hello ${userName || 'there'},</p>

      <div class="transaction-box">
        <h3>${transactionTypeLabel} Processed</h3>
        <p><strong>Amount:</strong> ${transactionType === 'top-up' ? '+' : '-'}${amountFormatted}</p>
        <p><strong>Description:</strong> ${description}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      </div>

      <div class="balance-info">
        <h3>Updated Balance:</h3>
        <p><strong>${balanceFormatted}</strong></p>
      </div>

      <div class="footer">
        <p>This is an automated confirmation from ${companyName}.</p>
        <p>If you have any questions about this transaction, please contact our support team.</p>
      </div>
    </body>
    </html>
  `

  const textContent = `
    ${companyName} - Transaction Confirmation

    Hello ${userName || 'there'},

    ${transactionTypeLabel} Processed:
    - Amount: ${transactionType === 'top-up' ? '+' : '-'}${amountFormatted}
    - Description: ${description}
    - Date: ${new Date().toLocaleString()}

    Updated Balance: ${balanceFormatted}

    This is an automated confirmation from ${companyName}.
  `

  try {
    if (useResend && resend) {
      await resend.emails.send({
        from: fromEmail,
        to: userEmail,
        subject,
        html: htmlContent,
        text: textContent,
      })
    } else if (transporter) {
      await transporter.sendMail({
        from: fromEmail,
        to: userEmail,
        subject,
        html: htmlContent,
        text: textContent,
      })
    } else {
      throw new Error('No email service configured')
    }

    console.log(`Transaction confirmation sent to ${userEmail}`)
  } catch (error) {
    console.error('Failed to send transaction confirmation:', error)
    throw error
  }
}
