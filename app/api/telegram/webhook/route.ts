import { NextResponse } from 'next/server'
import { handleCommand } from '@/lib/telegram/commands'
import type { TelegramUpdate } from '@/lib/telegram/bot'

export async function POST(request: Request) {
  // Verify webhook secret from Telegram
  const secret = request.headers.get('x-telegram-bot-api-secret-token')
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const update: TelegramUpdate = await request.json()

    if (update.message?.text) {
      // Fire-and-forget: Telegram expects fast 200 response
      // Process command in background
      handleCommand(update.message).catch(err =>
        console.error('[Telegram] Command error:', err)
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Telegram] Webhook error:', err)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}
