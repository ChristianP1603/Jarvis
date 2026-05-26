# JARVIS — Architecture

## Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (serverless)
- **Database**: Supabase (PostgreSQL + Auth + RLS)
- **Charts**: Recharts
- **Notifications**: Telegram Bot API
- **Cron**: GitHub Actions (5 scheduled jobs)
- **Hosting**: Vercel (Hobby Tier)

## Verzeichnisstruktur

```
jarvis/
├── app/
│   ├── (dashboard)/          # Auth-geschützte Pages
│   │   ├── page.tsx          # Dashboard (Home)
│   │   ├── training/         # Wochenplan + Actions
│   │   ├── nutrition/        # Makros, Mahlzeiten, Wasser
│   │   ├── sleep/            # Recovery + Sleep Score
│   │   ├── tasks/            # Task Manager
│   │   ├── journal/          # Tageslogbuch + Korrelationen
│   │   ├── goals/            # Ziele + Profilauswahl
│   │   ├── analytics/        # Charts (CTL/ATL/TSB, Volume, Weight)
│   │   └── settings/         # User Settings
│   ├── api/
│   │   ├── analytics/        # Chart-Daten
│   │   ├── coaching/         # Coaching Decisions Log
│   │   ├── cron/             # Metrics, Morning, Evening, Weekly, Plan
│   │   ├── goals/            # CRUD
│   │   ├── health/sync/      # Apple Health Webhook
│   │   ├── journal/          # Entries + Korrelationen
│   │   ├── nutrition/        # Meals + Water
│   │   ├── recovery/         # Score Berechnung
│   │   ├── tasks/            # CRUD + Views
│   │   ├── telegram/         # Webhook + Setup
│   │   ├── training/         # Plan + Workout Actions
│   │   ├── user/             # Setup + Settings
│   │   └── weight/           # Body Metrics
│   ├── auth/callback/        # OAuth Callback
│   └── login/                # Login Page
├── lib/
│   ├── coaching/             # ENGINE (Profiles, Plan Generator, Metrics)
│   ├── journal/              # Factors + Korrelationsanalyse
│   ├── nutrition/            # Target Berechnung
│   ├── sleep/                # Sleep Score + Recovery Score
│   ├── supabase/             # Client/Server/Admin/Middleware
│   └── telegram/             # Bot + Commands + Formatters
├── components/
│   ├── shared/               # BottomNav, SW Register
│   └── ui/                   # shadcn/ui Komponenten
├── supabase/
│   └── migrations/           # SQL Schema
├── public/                   # PWA Icons, Service Worker, Manifest
└── .github/workflows/        # Cron Jobs
```

## Datenfluss

```
Apple Health → iOS Shortcut → /api/health/sync → Supabase
                                                     ↓
GitHub Actions (cron) → /api/cron/metrics → TRIMP/CTL/ATL/TSB
                      → /api/cron/morning → Telegram Briefing
                      → /api/cron/evening → Telegram Recap
                      → /api/cron/plan-generation → Coaching Engine → Wochenplan
```

## Coaching Engine

Der Kern. Generiert personalisierte Wochenpläne basierend auf:

1. **Profil**: Running, Strength, Hybrid, Ironman
2. **Phase**: Base → Build → Peak → Taper (profilabhängig)
3. **Recovery Overlay**: Rot/Gelb/Grün basierend auf Recovery Score
4. **Deload**: Automatisch alle N Wochen oder bei TSB < -20
5. **Interferenz**: Keine harte Ausdauer 24h nach Bein-Kraft etc.
6. **Cross-Training**: Rad für aerobe Base auch bei Lauf-Ziel

## Implementation Status

- [x] Phase 1: Foundation (Next.js + Supabase + Auth + Schema)
- [x] Phase 2: Health Data, Sleep/Recovery, Nutrition, Journal, Settings
- [x] Phase 3: Coaching Engine (Profiles, Plan Generation, Interference)
- [x] Phase 4: Tasks CRUD + Workout Actions
- [x] Phase 5: Telegram Bot + Cron Jobs
- [x] Phase 6: Analytics Charts
- [x] Phase 7: Journal Correlations
- [x] Phase 8: PWA + Polish
