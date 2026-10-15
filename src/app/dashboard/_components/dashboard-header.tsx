'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function DashboardHeader({ providerName }: { providerName: string }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900">PayLink</p>
            <p className="text-xs text-gray-500">{providerName}</p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/settings"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Settings
            </Link>

            <button
              onClick={handleSignOut}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
