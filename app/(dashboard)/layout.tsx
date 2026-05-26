import { BottomNav } from '@/components/shared/bottom-nav'
import { ServiceWorkerRegister } from '@/components/shared/sw-register'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-dvh">
      <ServiceWorkerRegister />
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
