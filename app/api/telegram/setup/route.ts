import { NextResponse } from 'next/server'
import { setWebhook } from '@/lib/telegram/bot'

export async function POST(request: Request) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (!appUrl) {
    return NextResponse.json({ error: 'APP_URL not configured' }, { status: 500 })
  }

  const webhookUrl = `${appUrl}/api/telegram/webhook`
  const success = await setWebhook(webhookUrl)

  if (success) {
    return NextResponse.json({ ok: true, webhook_url: webhookUrl })
  }

  return NextResponse.json({ error: 'Failed to set webhook' }, { status: 500 })
}
