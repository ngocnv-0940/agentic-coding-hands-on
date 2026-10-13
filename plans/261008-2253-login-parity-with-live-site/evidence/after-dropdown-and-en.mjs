import { chromium } from '/home/nguyenvanngocb/work/agentic-coding-hands-on/node_modules/playwright/index.mjs'
const EV = '/home/nguyenvanngocb/work/agentic-coding-hands-on/plans/261008-2253-login-parity-with-live-site/evidence'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
const page = await ctx.newPage()
await page.goto('http://localhost:3200/login', { waitUntil: 'load', timeout: 90000 })
await page.waitForSelector('[data-testid="language-selector-trigger"]', { timeout: 60000 })
await page.waitForTimeout(800)
const trigger = page.getByTestId('language-selector-trigger')
const chevron = () => trigger.locator('img').last().evaluate(el => getComputedStyle(el).transform)
const before = { chevronTransform: await chevron() }
await trigger.hover(); await page.waitForTimeout(300)
const hoverTrigger = await trigger.evaluate(el => getComputedStyle(el).backgroundColor)
await page.mouse.move(0, 0); await page.waitForTimeout(250)
await trigger.click()
await page.waitForSelector('ul[id]', { timeout: 5000 })
await page.mouse.move(0, 0); await page.waitForTimeout(400)
const info = await page.evaluate(() => {
  const ul = document.querySelector('ul')
  const c = (e) => getComputedStyle(e)
  const ub = ul.getBoundingClientRect(), ucs = c(ul)
  const items = [...ul.querySelectorAll('li > button')].map(b => {
    const r = b.getBoundingClientRect(), s = c(b)
    return { text: b.textContent.trim(), box: [r.x, r.y, r.width, r.height].map(Math.round), pad: s.padding, bg: s.backgroundColor, radius: s.borderRadius, ariaCurrent: b.getAttribute('aria-current') }
  })
  return { panel: { box: [ub.x, ub.y, ub.width, ub.height].map(Math.round), pad: ucs.padding, bg: ucs.backgroundColor, border: ucs.borderTopColor + ' ' + ucs.borderTopWidth, radius: ucs.borderRadius, shadow: ucs.boxShadow.slice(0, 60), gap: ucs.rowGap }, items }
})
const trig = await trigger.boundingBox()
const after = { chevronTransform: await chevron(), expanded: await trigger.getAttribute('aria-expanded') }
await page.screenshot({ path: EV + '/after-dropdown-local-1440.png', clip: { x: 1000, y: 0, width: 440, height: 320 } })
await page.screenshot({ path: EV + '/after-dropdown-local-1440-full.png' })
console.log(JSON.stringify({ before, hoverTriggerBg: hoverTrigger, after, trigger: [trig.x, trig.y, trig.width, trig.height], ...info }, null, 1))
await ctx.close()

// EN check via locale cookie
const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await ctx2.addCookies([{ name: 'NEXT_LOCALE', value: 'en', url: 'http://localhost:3200' }])
const p2 = await ctx2.newPage()
await p2.goto('http://localhost:3200/login', { waitUntil: 'load', timeout: 90000 })
await p2.waitForSelector('main p', { timeout: 60000 })
const en = await p2.evaluate(() => ({ lang: document.documentElement.lang, paragraphs: [...document.querySelectorAll('main p')].map(p => p.textContent.trim()), footer: document.querySelector('footer')?.textContent.trim(), trigger: document.querySelector('[data-testid="language-selector-trigger"]')?.textContent.trim() }))
console.log('EN', JSON.stringify(en))
await p2.screenshot({ path: EV + '/after-en-local-1440.png' })
await browser.close()
