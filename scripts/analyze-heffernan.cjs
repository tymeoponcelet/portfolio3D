/**
 * analyze-heffernan.cjs  (Puppeteer v21+ compatible)
 * Analyse CSS Win95, DOM, polices, z-index de henryheffernan.com
 */

const puppeteer = require('puppeteer')
const fs        = require('fs')
const path      = require('path')

const OUT = path.join(__dirname, 'heffernan-analysis')
fs.mkdirSync(OUT, { recursive: true })

const sleep = ms => new Promise(r => setTimeout(r, ms))

;(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()

  // ── 1. Chargement ────────────────────────────────────────────────
  console.log('📡 Navigation vers henryheffernan.com…')
  await page.goto('https://henryheffernan.com/', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(5000)
  await page.screenshot({ path: path.join(OUT, '01-initial.png') })
  console.log('📸 Screenshot initial pris')

  // ── 2. Récupérer tout le CSS ──────────────────────────────────────
  console.log('🎨 Extraction CSS…')

  const inlineStyles = await page.evaluate(() =>
    Array.from(document.querySelectorAll('style')).map(s => s.textContent)
  )

  const externalLinks = await page.evaluate(() =>
    Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(l => l.href)
  )
  const externalCSS = []
  for (const href of externalLinks) {
    try {
      const text = await page.evaluate(async u => {
        const r = await fetch(u); return r.ok ? r.text() : '/* fetch failed */'
      }, href)
      externalCSS.push({ href, text })
    } catch { externalCSS.push({ href, text: '/* error */' }) }
  }

  const sheetRules = await page.evaluate(() => {
    const out = []
    for (const sheet of document.styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules).map(r => r.cssText)
        out.push({ href: sheet.href ?? 'inline', rules })
      } catch { out.push({ href: sheet.href ?? 'inline', rules: ['/* CORS blocked */'] }) }
    }
    return out
  })

  fs.writeFileSync(path.join(OUT, 'inline-styles.txt'),    inlineStyles.join('\n\n/* ─── */\n\n'))
  fs.writeFileSync(path.join(OUT, 'external-styles.json'), JSON.stringify(externalCSS, null, 2))
  fs.writeFileSync(path.join(OUT, 'sheet-rules.json'),     JSON.stringify(sheetRules, null, 2))
  console.log(`  → ${inlineStyles.length} balises <style>, ${externalCSS.length} sheets externes`)

  // ── 3. Polices ────────────────────────────────────────────────────
  console.log('🔤 Extraction polices…')
  const fontInfo = await page.evaluate(() => {
    const faces    = []
    const families = new Set()
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.constructor.name === 'CSSFontFaceRule') faces.push(rule.cssText)
        }
      } catch {}
    }
    document.querySelectorAll('*').forEach(el => {
      const ff = window.getComputedStyle(el).fontFamily
      if (ff) families.add(ff)
    })
    return { faces, families: [...families] }
  })
  fs.writeFileSync(path.join(OUT, 'fonts.json'), JSON.stringify(fontInfo, null, 2))

  // ── 4. Variables CSS ──────────────────────────────────────────────
  console.log('🔑 Variables CSS…')
  const cssVars = await page.evaluate(() => {
    const vars = {}
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.style) {
            for (const prop of rule.style) {
              if (prop.startsWith('--')) vars[prop] = rule.style.getPropertyValue(prop).trim()
            }
          }
        }
      } catch {}
    }
    return vars
  })
  fs.writeFileSync(path.join(OUT, 'css-variables.json'), JSON.stringify(cssVars, null, 2))

  // ── 5. Structure fenêtres Win95 ───────────────────────────────────
  console.log('🪟 Structure fenêtres…')
  const windowStructure = await page.evaluate(() => {
    const hexify = rgb => {
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (!m) return rgb
      return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
    }
    const results  = []
    const kws      = ['window','Window','win95','win-','dialog','panel','titlebar','title-bar','taskbar','desktop']
    const seen     = new Set()

    kws.forEach(kw => {
      document.querySelectorAll(`[class*="${kw}"]`).forEach(el => {
        if (seen.has(el)) return; seen.add(el)
        const cs   = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        const borders = {}
        for (const side of ['Top','Right','Bottom','Left']) {
          borders[side.toLowerCase()] = {
            width: cs[`border${side}Width`],
            style: cs[`border${side}Style`],
            color: hexify(cs[`border${side}Color`]),
          }
        }
        results.push({
          tag: el.tagName, id: el.id || null, className: el.className,
          rect: { w: Math.round(rect.width), h: Math.round(rect.height), x: Math.round(rect.x), y: Math.round(rect.y) },
          computed: {
            background:  hexify(cs.backgroundColor),
            color:       hexify(cs.color),
            fontFamily:  cs.fontFamily,
            fontSize:    cs.fontSize,
            zIndex:      cs.zIndex,
            position:    cs.position,
            display:     cs.display,
            boxShadow:   cs.boxShadow,
            padding:     cs.padding,
            cursor:      cs.cursor,
          },
          borders,
          outerHTML: el.outerHTML.slice(0, 800),
        })
      })
    })
    return results
  })
  fs.writeFileSync(path.join(OUT, 'window-structure.json'), JSON.stringify(windowStructure, null, 2))
  console.log(`  → ${windowStructure.length} éléments Win95 trouvés`)

  // ── 6. React Fiber handlers/state ─────────────────────────────────
  console.log('⚛️  React handlers…')
  const reactData = await page.evaluate(() => {
    function getFiber(el) {
      const k = Object.keys(el).find(k => k.startsWith('__reactFiber') || k.startsWith('__reactInternalInstance'))
      return k ? el[k] : null
    }
    function walkFiber(fiber, depth = 0) {
      if (!fiber || depth > 12) return []
      const items    = []
      const props    = fiber.memoizedProps || {}
      const handlers = Object.entries(props)
        .filter(([k,v]) => k.startsWith('on') && typeof v === 'function')
        .map(([k,v]) => ({ event: k, fn: v.toString().slice(0, 400) }))
      let stateVal = null
      if (fiber.memoizedState?.memoizedState !== undefined) {
        try { stateVal = JSON.stringify(fiber.memoizedState.memoizedState) } catch {}
      }
      if (handlers.length || stateVal) {
        items.push({
          component: typeof fiber.type === 'function' ? (fiber.type.name || 'Anonymous') : String(fiber.type),
          handlers, state: stateVal,
        })
      }
      return [...items, ...walkFiber(fiber.return, depth + 1)]
    }

    const results = []
    const kws     = ['window','Window','win95','taskbar','desktop','title']
    const seen    = new Set()
    kws.forEach(kw => {
      document.querySelectorAll(`[class*="${kw}"]`).forEach(el => {
        if (seen.has(el)) return; seen.add(el)
        const entries = walkFiber(getFiber(el))
        if (entries.length) results.push({ element: el.className.slice(0, 60), entries })
      })
    })
    return results
  })
  fs.writeFileSync(path.join(OUT, 'react-handlers.json'), JSON.stringify(reactData, null, 2))

  // ── 7. Interactions clics ─────────────────────────────────────────
  console.log('🖱 Simulation clics…')

  const clickTargets = await page.evaluate(() =>
    Array.from(document.querySelectorAll('[class*="icon"],[class*="Icon"],[class*="btn"],[class*="Btn"],[class*="window"],[class*="Window"]'))
      .filter(el => { const r = el.getBoundingClientRect(); return r.width > 20 && r.height > 20 })
      .slice(0, 5)
      .map(el => {
        const r = el.getBoundingClientRect()
        return { x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2), cls: el.className.slice(0,40) }
      })
  )

  for (let i = 0; i < clickTargets.length; i++) {
    const t = clickTargets[i]
    console.log(`  Clic [${t.cls}] (${t.x},${t.y})`)
    await page.mouse.click(t.x, t.y)
    await sleep(1200)
    await page.screenshot({ path: path.join(OUT, `0${i+2}-click-${i}.png`) })

    const zInfo = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[class*="window"],[class*="Window"]'))
        .map(el => ({ cls: el.className.slice(0,60), z: window.getComputedStyle(el).zIndex, pos: window.getComputedStyle(el).position }))
    )
    fs.writeFileSync(path.join(OUT, `zindex-click-${i}.json`), JSON.stringify(zInfo, null, 2))
  }

  // ── 8. RÉSUMÉ TERMINAL ───────────────────────────────────────────
  console.log('\n════════════════════════════════════════════')
  console.log('  RAPPORT — henryheffernan.com')
  console.log('════════════════════════════════════════════\n')

  console.log('── @font-face ──')
  if (!fontInfo.faces.length) console.log('  aucune')
  fontInfo.faces.forEach(f => console.log(' ', f.slice(0,160)))

  console.log('\n── Familles CSS utilisées ──')
  fontInfo.families.forEach(f => console.log(' •', f))

  console.log('\n── Variables CSS ──')
  if (!Object.keys(cssVars).length) console.log('  aucune')
  Object.entries(cssVars).forEach(([k,v]) => console.log(` ${k}: ${v}`))

  console.log('\n── Éléments Win95 (computed styles) ──')
  windowStructure.forEach(w => {
    console.log(`\n  .${w.className.trim().slice(0,60)}`)
    console.log(`    bg="${w.computed.background}"  color="${w.computed.color}"  z-index=${w.computed.zIndex}`)
    console.log(`    font: ${w.computed.fontFamily}  ${w.computed.fontSize}`)
    console.log(`    box-shadow: ${w.computed.boxShadow?.slice(0,80)}`)
    console.log(`    border-top:    ${w.borders.top.width} ${w.borders.top.style} ${w.borders.top.color}`)
    console.log(`    border-right:  ${w.borders.right.width} ${w.borders.right.style} ${w.borders.right.color}`)
    console.log(`    border-bottom: ${w.borders.bottom.width} ${w.borders.bottom.style} ${w.borders.bottom.color}`)
    console.log(`    border-left:   ${w.borders.left.width} ${w.borders.left.style} ${w.borders.left.color}`)
    console.log(`    HTML: ${w.outerHTML.slice(0,200).replace(/\n/g,' ')}`)
  })

  console.log('\n── React handlers ──')
  reactData.slice(0,8).forEach(r => {
    console.log(`\n  [${r.element}]`)
    r.entries.forEach(e => {
      console.log(`    <${e.component}>`)
      e.handlers.forEach(h => console.log(`      ${h.event}: ${h.fn.slice(0,120).replace(/\n/g,' ')}`))
      if (e.state) console.log(`      state: ${String(e.state).slice(0,100)}`)
    })
  })

  console.log('\n── CSS filtré (border / background / font / z-index) ──')
  const allCSS = sheetRules.flatMap(s => s.rules).join('\n')
  allCSS.split('\n')
    .filter(l => /border|background|font-family|color:|z-index|box-shadow/.test(l))
    .slice(0, 100)
    .forEach(l => console.log(' ', l.trim()))

  console.log('\n✅ Fichiers dans :', OUT)
  await browser.close()
})()
