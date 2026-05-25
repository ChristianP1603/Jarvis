import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const today = new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="pt-2">
        <p className="text-zinc-500 text-sm">{today}</p>
        <h1 className="text-2xl font-bold">
          Hey{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
        </h1>
      </div>

      {/* Recovery Score */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium">Recovery</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-5xl font-bold text-emerald-400">--</div>
            <div className="text-sm text-zinc-500">
              Keine Daten. Verbinde Apple Health in den Settings.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Workout */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium">Training heute</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500 text-sm">
            Kein Trainingsplan aktiv. Erstelle ein Ziel um loszulegen.
          </p>
        </CardContent>
      </Card>

      {/* Nutrition */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium">Nutrition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2 text-center">
            <div>
              <p className="text-lg font-semibold">--</p>
              <p className="text-[10px] text-zinc-500">kcal</p>
            </div>
            <div>
              <p className="text-lg font-semibold">--</p>
              <p className="text-[10px] text-zinc-500">Carbs</p>
            </div>
            <div>
              <p className="text-lg font-semibold">--</p>
              <p className="text-[10px] text-zinc-500">Protein</p>
            </div>
            <div>
              <p className="text-lg font-semibold">--</p>
              <p className="text-[10px] text-zinc-500">Fett</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks */}
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-zinc-400 font-medium">Tasks heute</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-500 text-sm">Keine Tasks fällig.</p>
        </CardContent>
      </Card>
    </div>
  )
}
