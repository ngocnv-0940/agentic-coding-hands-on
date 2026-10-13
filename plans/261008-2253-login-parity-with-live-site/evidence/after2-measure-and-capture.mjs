import { chromium } from '/home/nguyenvanngocb/work/agentic-coding-hands-on/node_modules/playwright/index.mjs'
import fs from 'node:fs'
const [url, label, outDir] = process.argv.slice(2)
const VIEWPORTS = [[768,1024],[1024,768],[1440,900]]
const browser = await chromium.launch()
const out = {}
for (const [w,h] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: 'load', timeout: 90000 })
  await page.waitForSelector('main img', { timeout: 60000 })
  await page.waitForTimeout(1500)
  const r = await page.evaluate(() => {
    const box = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return [b.x,b.y,b.width,b.height].map(v => Math.round(v*10)/10) }
    const cs = (e) => { if (!e) return null; const c = getComputedStyle(e); return { weight: c.fontWeight, size: c.fontSize, lh: c.lineHeight, family: c.fontFamily.split(',')[0], pad: c.padding, opacity: c.opacity } }
    const q = (s) => document.querySelector(s)
    const btn = q('main button')
    const lt = btn?.textContent?.trim()
    const label = [...(btn?.querySelectorAll('span') ?? [])].find(s => s.textContent.trim() === lt && !s.querySelector('span')) ?? btn
    const footer = q('footer')
    const footerP = footer?.querySelector('p')
    const heroText = q('main p')
    return {
      logo: { box: box(q('header img')), css: cs(q('header img')) },
      header: { box: box(q('header')) },
      langTrigger: { box: box(q('header button')), css: cs(q('header button')) },
      hero: { box: box(q('main img')), css: cs(q('main img')) },
      text: { box: box(heroText), css: cs(heroText), text: heroText?.textContent?.trim() },
      button: { box: box(btn), css: cs(btn) },
      buttonLabel: { box: box(label), css: cs(label), text: label?.textContent?.trim() },
      footer: { box: box(footer), css: cs(footer) },
      footerText: { box: box(footerP), css: cs(footerP), text: footerP?.textContent?.trim() },
      lang: document.documentElement.lang,
      scrollHeight: document.documentElement.scrollHeight,
      scrollWidth: document.documentElement.scrollWidth,
    }
  })
  out[`${w}x${h}`] = r
  await page.screenshot({ path: `${outDir}/after2-${label}-${w}.png` })
  await ctx.close()
}
fs.writeFileSync(`${outDir}/after2-measure-${label}.json`, JSON.stringify(out, null, 1))
await browser.close()
console.log(JSON.stringify(Object.fromEntries(Object.entries(out).map(([k,v]) => [k, { logoX: v.logo.box?.[0], heroBox: v.hero.box, textX: v.text.box?.[0], btnBox: v.button.box, labelSize: v.buttonLabel.css?.size, footerH: v.footer.box?.[3], textWeight: v.text.css?.weight }])), null, 1))
