import { chromium } from '/home/nguyenvanngocb/work/agentic-coding-hands-on/node_modules/playwright/index.mjs'
const [url] = process.argv.slice(2)
const browser = await chromium.launch()
for (const [w,h] of [[375,812],[768,1024],[1024,768],[1920,1080]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  const r = await page.evaluate(() => {
    const q = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(), c = getComputedStyle(e); return `${[b.x,b.y,b.width,b.height].map(Math.round)} ${c.fontWeight} ${c.fontSize}/${c.lineHeight} pad:${c.padding}` }
    return { header: q('header'), logo: q('header img'), lang: q('header button'), hero: q('main img'), text: q('main p'), btn: q('main button'), btnText: q('main button span'), footer: q('footer'), ftext: q('footer p'), docH: document.documentElement.scrollHeight }
  })
  console.log(w, JSON.stringify(r, null, 0))
  await page.close()
}
await browser.close()
