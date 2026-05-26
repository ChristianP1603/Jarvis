# JARVIS

Self-hosted personal operating system for training, nutrition, sleep and productivity. Built because every coaching app out there either costs 30€/month or treats strength and endurance like separate planets.

The core idea: a coaching engine that actually thinks like an experienced endurance/fitness coach — periodized plans, cross-training intelligence (yes, bike sessions make you a better runner), automatic deloads, and daily adjustments based on recovery.

## What it does

**Training** — Weekly plans generated from your active goal and training profile. Supports running, strength, hybrid and ironman profiles. The engine handles periodization (Base → Build → Peak → Taper), interference rules (no hard endurance after leg day), and cross-training logic. Recovery overlay adjusts or replaces sessions based on how you're actually feeling.

**Recovery & Sleep** — Pulls data from Apple Health via iOS Shortcuts. Calculates sleep score (duration, efficiency, deep/REM, consistency) and recovery score (HRV baseline deviation, resting HR, sleep quality, journal factors). Red/yellow/green system that directly influences tomorrow's training.

**Nutrition** — Macro tracking via predefined meal templates + manual entry. Auto-calculates targets based on BMR, activity level, and today's training. Water tracking.

**Tasks** — Simple task manager with priorities, due dates, projects. Views for today, inbox, upcoming, completed.

**Journal** — Daily factor logging (alcohol, stress, late caffeine, meditation, etc.). Correlation engine analyzes 90 days of data and surfaces patterns like "alcohol drops your recovery by ~12 points".

**Analytics** — CTL/ATL/TSB fitness curves, training volume, weight trend with rolling average, recovery and sleep charts.

**Telegram Bot** — Morning briefing (recovery, today's plan, tasks), evening recap, weekly summary. Commands for quick task entry, weight logging, status checks.

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres, Auth, RLS)
- Tailwind CSS + shadcn/ui
- Recharts
- Telegram Bot API
- GitHub Actions for cron jobs
- Vercel (Hobby Tier)

Runs at $0/month.

## Setup

```bash
git clone https://github.com/ChristianP1603/Jarvis.git
cd Jarvis
npm install
cp .env.local.example .env.local
# fill in your Supabase + Telegram credentials
npm run dev
```

### Supabase

Create a project, then run the migration:

```bash
npx supabase db push
```

### Telegram

1. Create a bot via `@BotFather`
2. Get your chat ID (send a message to the bot, then check `https://api.telegram.org/bot<TOKEN>/getUpdates`)
3. Add `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` to env
4. Register the webhook: `POST /api/telegram/setup` with `Authorization: Bearer <CRON_SECRET>`

### GitHub Actions

Add these secrets to the repo:
- `APP_URL` — your deployed Vercel URL
- `CRON_SECRET` — same as in `.env.local`

### Apple Health

Set up an iOS Shortcut that runs on a schedule and POSTs to `/api/health/sync` with your `HEALTH_SYNC_API_KEY`. Sends activities, sleep data, and weight.

## Project structure

```
app/
  (dashboard)/     — all authenticated pages
  api/             — serverless API routes
lib/
  coaching/        — the engine (profiles, plan generation, metrics)
  sleep/           — sleep + recovery score calculation
  nutrition/       — macro target calculation
  journal/         — factor definitions + correlation analysis
  telegram/        — bot client, commands, message formatters
  supabase/        — client/server/admin wrappers
docs/              — architecture + coaching engine spec
```

Details in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/COACHING_ENGINE.md](docs/COACHING_ENGINE.md).

## License

Private project — not open source.
