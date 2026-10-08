import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getCurrentUser } from '@/lib/auth/get-current-user'
import { ComingSoonPage } from '../_behavior/coming-soon-content'

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh]" aria-hidden="true" />}>
      <AdminGate />
    </Suspense>
  )
}

// Defense in depth: proxy.ts already redirects non-admins; this re-checks the role server-side.
async function AdminGate() {
  // Auth reads Date.now(); Cache Components rejects that during prerender (docs: connection.md).
  await connection()
  const user = await getCurrentUser()
  if (!user?.isAdmin) redirect('/')
  return <ComingSoonPage />
}
