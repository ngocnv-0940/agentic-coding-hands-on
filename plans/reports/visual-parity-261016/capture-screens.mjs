// Throwaway visual-parity capture. Reuses the e2e harness contract: mock Supabase on E2E_SUPABASE_PORT,
// stubbed Google authorize -> /auth/callback with a mock code. Read-only w.r.t. the repo.
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const APP = process.env.APP_URL ?? 'http://localhost:3100'
const OUT = '/home/nguyenvanngocb/work/agentic-coding-hands-on/plans/reports/visual-parity-261016'
const WIDTH = 1440
const mode = process.argv[2] ?? 'public' // public | user | writer
mkdirSync(OUT, { recursive: true })

const CODES = { user: 'stub-code', writer: 'stub-code-kudos-writer' }

async function login(page, code) {
  await page.route('**/auth/v1/authorize**', async (route) => {
    const u = new URL(route.request().url())
    const cb = new URL(u.searchParams.get('redirect_to') ?? `${APP}/auth/callback`)
    cb.searchParams.set('code', code)
    await route.fulfill({ status: 302, headers: { location: cb.toString() } })
  })
  await page.goto(`${APP}/login`)
  await page.getByRole('button', { name: /login with google/i }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login') && !url.pathname.startsWith('/auth/'))
}

async function shot(page, name, opts = {}) {
  await page.mouse.move(0, 0)
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(800)
  const path = `${OUT}/${name}.png`
  await page.screenshot({ path, fullPage: opts.fullPage ?? true, animations: 'disabled' })
  console.log('saved', path)
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: WIDTH, height: mode === 'writer' ? 1100 : 900 }, deviceScaleFactor: 1, locale: 'vi-VN' })
const page = await context.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`) })

try {
  if (mode === 'public') {
    await page.goto(`${APP}/login`)
    await shot(page, `login-${WIDTH}`)
    await page.goto(`${APP}/prelaunch`)
    await shot(page, `prelaunch-${WIDTH}`)
  } else if (mode === 'user') {
    await login(page, CODES.user)
    await page.goto(`${APP}/`)
    await shot(page, `homepage-${WIDTH}`)
    await page.goto(`${APP}/awards-information`)
    await shot(page, `awards-information-${WIDTH}`)
  } else if (mode === 'prelaunch') {
    await page.goto(`${APP}/prelaunch`)
    await shot(page, `prelaunch-${WIDTH}`)
  } else if (mode === 'writer') {
    await login(page, CODES.writer)
    await page.goto(`${APP}/sun-kudos`)
    await shot(page, `sun-kudos-${WIDTH}`)
    await page.getByTestId('kudos-compose-pill').click()
    await page.waitForTimeout(800)
    const dialog = page.getByRole('dialog').first()
    const recipient = dialog.getByRole('combobox').first()
    console.log('on-open recipient aria-invalid=', await recipient.getAttribute('aria-invalid').catch(() => 'n/a'),
      'focused=', await page.evaluate(() => document.activeElement?.tagName + ':' + (document.activeElement?.getAttribute('placeholder') ?? '')))
    await dialog.screenshot({ path: `${OUT}/write-kudo-dialog-${WIDTH}.png`, animations: 'disabled' })
    console.log('saved dialog element shot')
  }
} finally {
  console.log('console/page errors:', JSON.stringify(errors.slice(0, 20), null, 2))
  await browser.close()
}
