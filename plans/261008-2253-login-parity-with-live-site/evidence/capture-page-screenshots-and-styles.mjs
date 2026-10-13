import { chromium } from '/home/nguyenvanngocb/work/agentic-coding-hands-on/node_modules/playwright/index.mjs'
const [url, name] = process.argv.slice(2)
const browser = await chromium.launch()
for (const [w,h] of [[1440,900],[375,812]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } })
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${name}-${w}.png`, fullPage: true })
  if (w === 1440) {
    const info = await page.evaluate(() => {
      const out = []
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue
        const cs = getComputedStyle(el)
        const txt = [...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join(' ')
        if (!(txt || ['IMG','BUTTON','HEADER','FOOTER','MAIN','svg','A','H1'].includes(el.tagName) || cs.backgroundImage!=='none')) continue
        out.push({tag:el.tagName, txt:txt.slice(0,80), src:el.currentSrc||el.getAttribute('src')||'', box:[r.x,r.y,r.width,r.height].map(Math.round).join(','), font:`${cs.fontFamily.split(',')[0]} ${cs.fontWeight} ${cs.fontSize}/${cs.lineHeight} ls:${cs.letterSpacing}`, color:cs.color, bg:cs.backgroundColor, bgi:cs.backgroundImage.slice(0,140), border:cs.borderTop, radius:cs.borderRadius, pad:cs.padding})
      }
      return { title: document.title, html: document.documentElement.lang, out }
    })
    const fs = await import('node:fs'); fs.writeFileSync(`${name}-dom.json`, JSON.stringify(info, null, 1))
  }
  await page.close()
}
await browser.close()
