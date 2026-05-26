import { createAdminClient } from '@/lib/supabase/admin'
import { sendMessage, getChatId } from './bot'
import { formatStatus } from './formatters'
import type { TelegramMessage } from './bot'

async function getUserByTelegramChat(chatId: number) {
  const supabase = createAdminClient()
  // For single-user, verify against env TELEGRAM_CHAT_ID
  const configuredChat = getChatId()
  if (String(chatId) !== configuredChat) return null

  const { data } = await supabase.from('users').select('id').limit(1).single()
  return data?.id || null
}

export async function handleCommand(message: TelegramMessage): Promise<void> {
  const text = message.text?.trim() || ''
  const chatId = message.chat.id
  const userId = await getUserByTelegramChat(chatId)

  if (!userId) {
    await sendMessage(chatId, '⛔ Nicht autorisiert.')
    return
  }

  const supabase = createAdminClient()
  const cmd = text.split(' ')[0].toLowerCase()
  const args = text.slice(cmd.length).trim()

  switch (cmd) {
    case '/start':
    case '/help': {
      await sendMessage(chatId, [
        '<b>🤖 JARVIS Commands</b>',
        '',
        '/status — Recovery & Fitness Overview',
        '/today — Heutiges Training + Tasks',
        '/done [task] — Task als erledigt markieren',
        '/add [task] — Schnell-Task hinzufügen',
        '/weight [kg] — Gewicht loggen',
        '/water [ml] — Wasser loggen',
      ].join('\n'))
      break
    }

    case '/status': {
      const today = new Date().toISOString().split('T')[0]

      const [metricsRes, recoveryRes, weightRes] = await Promise.all([
        supabase.from('fitness_metrics').select('ctl, atl, tsb')
          .eq('user_id', userId).eq('date', today).single(),
        supabase.from('recovery_scores').select('score')
          .eq('user_id', userId).eq('date', today).single(),
        supabase.from('body_metrics').select('weight_kg')
          .eq('user_id', userId).order('date', { ascending: false }).limit(1).single(),
      ])

      await sendMessage(chatId, formatStatus({
        recoveryScore: recoveryRes.data?.score || 0,
        ctl: metricsRes.data?.ctl || 0,
        atl: metricsRes.data?.atl || 0,
        tsb: metricsRes.data?.tsb || 0,
        weight: weightRes.data?.weight_kg || null,
      }))
      break
    }

    case '/today': {
      const today = new Date().toISOString().split('T')[0]
      const weekStart = getWeekStart(today)
      const weekEnd = getWeekEnd(today)
      const dayIdx = new Date(today).getDay() || 7 // 1=Mon...7=Sun

      const [workoutsRes, tasksRes] = await Promise.all([
        supabase.from('planned_workouts')
          .select('id, name, session_type, zone, completed, skipped')
          .eq('user_id', userId)
          .gte('plan_date', weekStart)
          .lte('plan_date', weekEnd)
          .eq('day_of_week', dayIdx),
        supabase.from('tasks')
          .select('id, title, priority')
          .eq('user_id', userId)
          .eq('completed', false)
          .lte('due_date', today)
          .order('priority'),
      ])

      const workouts = workoutsRes.data || []
      const tasks = tasksRes.data || []

      const lines = ['<b>📅 Heute</b>', '']

      if (workouts.length > 0) {
        lines.push('<b>🏋️ Training:</b>')
        for (const w of workouts) {
          const status = w.completed ? '✅' : w.skipped ? '⏭️' : '⬜'
          lines.push(`  ${status} ${w.name}`)
        }
      } else {
        lines.push('🛋️ Ruhetag')
      }

      if (tasks.length > 0) {
        lines.push('', `<b>📋 ${tasks.length} Tasks:</b>`)
        for (const t of tasks.slice(0, 8)) {
          const emojiMap: Record<number, string> = { 1: '🔴', 2: '🟠', 3: '🔵', 4: '⚪' }
          const emoji = emojiMap[t.priority] || '⚪'
          lines.push(`  ${emoji} ${t.title}`)
        }
      }

      await sendMessage(chatId, lines.join('\n'))
      break
    }

    case '/done': {
      if (!args) {
        await sendMessage(chatId, '❓ Welcher Task? z.B. <code>/done Einkaufen</code>')
        break
      }

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title')
        .eq('user_id', userId)
        .eq('completed', false)
        .ilike('title', `%${args}%`)
        .limit(1)

      if (tasks && tasks.length > 0) {
        await supabase.from('tasks').update({
          completed: true,
          completed_at: new Date().toISOString(),
        }).eq('id', tasks[0].id)
        await sendMessage(chatId, `✅ <b>${tasks[0].title}</b> erledigt!`)
      } else {
        await sendMessage(chatId, `🤷 Kein offener Task mit "${args}" gefunden.`)
      }
      break
    }

    case '/add': {
      if (!args) {
        await sendMessage(chatId, '❓ Was soll ich hinzufügen? z.B. <code>/add Arzt anrufen</code>')
        break
      }

      const { data, error } = await supabase.from('tasks').insert({
        user_id: userId,
        title: args,
        priority: 4,
        tags: [],
        source: 'telegram',
      }).select('id, title').single()

      if (data) {
        await sendMessage(chatId, `✅ Task hinzugefügt: <b>${data.title}</b>`)
      } else {
        await sendMessage(chatId, `❌ Fehler: ${error?.message || 'Unbekannt'}`)
      }
      break
    }

    case '/weight': {
      const kg = parseFloat(args)
      if (isNaN(kg) || kg < 30 || kg > 300) {
        await sendMessage(chatId, '❓ z.B. <code>/weight 82.5</code>')
        break
      }

      const today = new Date().toISOString().split('T')[0]
      const { error } = await supabase.from('body_metrics').upsert(
        { user_id: userId, date: today, weight_kg: kg, source: 'telegram' },
        { onConflict: 'user_id,date' }
      )

      if (!error) {
        await sendMessage(chatId, `⚖️ Gewicht gespeichert: <b>${kg} kg</b>`)
      } else {
        await sendMessage(chatId, `❌ ${error.message}`)
      }
      break
    }

    case '/water': {
      const ml = parseInt(args, 10)
      if (isNaN(ml) || ml < 1 || ml > 5000) {
        await sendMessage(chatId, '❓ z.B. <code>/water 500</code> (in ml)')
        break
      }

      const today = new Date().toISOString().split('T')[0]
      const { data: existing } = await supabase
        .from('nutrition_daily')
        .select('water_ml')
        .eq('user_id', userId)
        .eq('date', today)
        .single()

      const newTotal = (existing?.water_ml || 0) + ml
      await supabase.from('nutrition_daily').upsert(
        { user_id: userId, date: today, water_ml: newTotal },
        { onConflict: 'user_id,date' }
      )

      await sendMessage(chatId, `💧 +${ml}ml — Gesamt: <b>${(newTotal / 1000).toFixed(1)}L</b>`)
      break
    }

    default: {
      await sendMessage(chatId, '🤔 Unbekannter Befehl. Tippe /help für alle Commands.')
    }
  }
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return d.toISOString().split('T')[0]
}

function getWeekEnd(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay() || 7
  d.setDate(d.getDate() + (7 - day))
  return d.toISOString().split('T')[0]
}
