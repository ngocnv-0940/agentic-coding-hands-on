import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { getDictionary } from '@/lib/i18n/get-dictionary'
import { getLocale } from '@/lib/i18n/get-locale'
import { createClient } from '@/lib/supabase/server'
import { LogoutButton } from './logout-button'

// cacheComponents: true makes cookies()/getUser() request-time work, so it sits behind a
// <Suspense> boundary (docs: 01-app/01-getting-started/08-caching.md, "Working with runtime APIs").
export default function TodoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#00101A] px-4 text-white">
      <Suspense fallback={<div className="h-40 w-full max-w-md" aria-hidden="true" />}>
        <UserPanel />
      </Suspense>
    </main>
  )
}

async function UserPanel() {
  // supabase-js calls Date.now() while loading the session; Cache Components rejects that during
  // prerender (docs: 03-api-reference/04-functions/connection.md), so wait for a real request first.
  await connection()
  // Defense in depth: proxy.ts already guards /todo, but the page verifies with Supabase too.
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/login')

  const dict = getDictionary(await getLocale())

  return (
    <section className="flex w-full max-w-md flex-col gap-6 rounded-lg border border-white/15 p-6">
      <h1 className="text-2xl font-bold">{dict['todo.title']}</h1>
      <p className="break-all text-base">
        <span className="text-white/60">{dict['todo.emailLabel']}: </span>
        <span data-testid="todo-email">{data.user.email || dict['todo.emailMissing']}</span>
      </p>
      <form action="/auth/logout" method="post">
        <LogoutButton label={dict['todo.logout']} />
      </form>
    </section>
  )
}
