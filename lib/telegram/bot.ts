const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!
const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`

export interface TelegramMessage {
  message_id: number
  from: { id: number; first_name: string }
  chat: { id: number; type: string }
  text?: string
  date: number
}

export interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

export async function sendMessage(
  chatId: string | number,
  text: string,
  options?: { parse_mode?: 'HTML' | 'MarkdownV2'; reply_markup?: unknown }
): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(Object.assign(
        { chat_id: chatId, text, parse_mode: options?.parse_mode || 'HTML' },
        options?.reply_markup ? { reply_markup: options.reply_markup } : {}
      )),
    })
    return res.ok
  } catch {
    console.error('[Telegram] sendMessage failed')
    return false
  }
}

export async function setWebhook(url: string): Promise<boolean> {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  const res = await fetch(`${BASE_URL}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      secret_token: secret,
      allowed_updates: ['message'],
    }),
  })
  return res.ok
}

export function getChatId(): string {
  return process.env.TELEGRAM_CHAT_ID!
}
