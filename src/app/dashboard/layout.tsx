import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardHeader } from './_components/dashboard-header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: provider } = await supabase
    .from('providers')
    .select('full_name')
    .eq('user_id', user.id)
    .single()

  if (!provider) redirect('/onboarding')

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader providerName={provider.full_name} />
      {children}
    </div>
  )
}
