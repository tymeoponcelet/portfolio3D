/**
 * audit-os-app.cjs
 * Analyse directe de os.henryheffernan.com (l'app Win95 React)
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
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()

  console.log('📡 Chargement os.henryheffernan.com…')
  await page.goto('https://os.henryheffernan.com/', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(4000)
  await page.screenshot({ path: path.join(OUT, 'os-01-initial.png') })

  // ── Computed styles de TOUS les éléments visibles ──────────────────────
  const allStyles = await page.evaluate(() => {
    const hexify = rgb => {
      if (!rgb) return 'N/A'
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (!m) return rgb
      return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
    }

    const results = []
    const seen = new Set()

    document.querySelectorAll('*').forEach(el => {
      if (seen.has(el)) return
      seen.add(el)

      const rect = el.getBoundingClientRect()
      if (rect.width < 10 || rect.height < 10) return

      const cs = window.getComputedStyle(el)
      const cls = (el.className || '').toString()

      // Ne garder que les éléments avec box-shadow ou border intéressants
      const hasBoxShadow = cs.boxShadow && cs.boxShadow !== 'none'
      const hasBackdrop  = cs.backdropFilter && cs.backdropFilter !== 'none'
      const hasGradient  = cs.background && cs.background.includes('gradient')
      const isWin        = /window|win|titlebar|title-bar|taskbar|desktop|dialog|panel|toolbar|btn|button|start/i.test(cls)

      if (!hasBoxShadow && !hasBackdrop && !hasGradient && !isWin) return

      results.push({
        tag:            el.tagName,
        className:      cls.slice(0, 100),
        id:             el.id || null,
        rect:           { w: Math.round(rect.width), h: Math.round(rect.height), x: Math.round(rect.x), y: Math.round(rect.y) },
        background:     hexify(cs.backgroundColor),
        backgroundFull: cs.background.slice(0, 200),
        color:          hexify(cs.color),
        boxShadow:      cs.boxShadow || 'none',
        backdropFilter: cs.backdropFilter || 'none',
        filter:         cs.filter || 'none',
        borderImage:    cs.borderImageSource || 'none',
        borderTop:      `${cs.borderTopWidth} ${cs.borderTopStyle} ${hexify(cs.borderTopColor)}`,
        borderRight:    `${cs.borderRightWidth} ${cs.borderRightStyle} ${hexify(cs.borderRightColor)}`,
        borderBottom:   `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${hexify(cs.borderBottomColor)}`,
        borderLeft:     `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${hexify(cs.borderLeftColor)}`,
        padding:        `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
        margin:         `${cs.marginTop} ${cs.marginRight} ${cs.marginBottom} ${cs.marginLeft}`,
        fontFamily:     cs.fontFamily,
        fontSize:       cs.fontSize,
        fontWeight:     cs.fontWeight,
        letterSpacing:  cs.letterSpacing,
        zIndex:         cs.zIndex,
        position:       cs.position,
        display:        cs.display,
        flexDir:        cs.flexDirection,
        alignItems:     cs.alignItems,
        gap:            cs.gap,
        cursor:         cs.cursor,
        opacity:        cs.opacity,
        textContent:    el.childElementCount === 0 ? el.textContent.trim().slice(0, 60) : undefined,
      })
    })
    return results
  })

  fs.writeFileSync(path.join(OUT, 'os-all-styles.json'), JSON.stringify(allStyles, null, 2))
  console.log(`  → ${allStyles.length} éléments avec styles notables`)

  // ── CSS Variables ──────────────────────────────────────────────────────
  const cssData = await page.evaluate(() => {
    const vars  = {}
    const faces = []
    const rules = []

    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.style) {
            for (const prop of rule.style) {
              if (prop.startsWith('--')) vars[prop] = rule.style.getPropertyValue(prop).trim()
            }
          }
          if (rule.constructor.name === 'CSSFontFaceRule') faces.push(rule.cssText)
          if (rule.selectorText) rules.push({ sel: rule.selectorText, css: rule.cssText.slice(0, 300) })
        }
      } catch { /* CORS */ }
    }
    return { vars, faces, rules }
  })

  fs.writeFileSync(path.join(OUT, 'os-css-data.json'), JSON.stringify(cssData, null, 2))
  console.log(`  → ${Object.keys(cssData.vars).length} CSS vars, ${cssData.faces.length} @font-face, ${cssData.rules.length} rules`)

  // ── Taskbar Win95 spécifique ───────────────────────────────────────────
  const taskbarWin95 = await page.evaluate(() => {
    const hexify = rgb => {
      if (!rgb) return 'N/A'
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (!m) return rgb
      return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
    }

    const selectors = [
      '[class*="taskbar"]', '[class*="Taskbar"]', '[class*="task-bar"]',
      '[class*="toolbar"]', '[class*="Toolbar"]', '[class*="start"]',
      '[class*="tray"]', '[class*="clock"]',
    ]

    const found = []
    const seen = new Set()

    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        if (seen.has(el)) return
        seen.add(el)
        const cs   = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()
        if (rect.width < 20) return

        const children = Array.from(el.children).map(c => {
          const cr  = c.getBoundingClientRect()
          const ccs = window.getComputedStyle(c)
          return {
            tag: c.tagName, cls: (c.className||'').toString().slice(0,60),
            text: c.textContent.trim().slice(0,30),
            w: Math.round(cr.width), h: Math.round(cr.height), x: Math.round(cr.x), y: Math.round(cr.y),
            paddingTop: ccs.paddingTop, paddingRight: ccs.paddingRight,
            paddingBottom: ccs.paddingBottom, paddingLeft: ccs.paddingLeft,
            marginTop: ccs.marginTop, marginRight: ccs.marginRight,
            marginBottom: ccs.marginBottom, marginLeft: ccs.marginLeft,
            gap: ccs.gap, bg: hexify(ccs.backgroundColor),
            fontSize: ccs.fontSize, fontFamily: ccs.fontFamily, cursor: ccs.cursor,
            boxShadow: ccs.boxShadow,
          }
        })

        found.push({
          sel, tag: el.tagName, cls: (el.className||'').toString().slice(0,80),
          rect: { w: Math.round(rect.width), h: Math.round(rect.height), x: Math.round(rect.x), y: Math.round(rect.y) },
          bg: hexify(cs.backgroundColor), boxShadow: cs.boxShadow,
          paddingTop: cs.paddingTop, paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom, paddingLeft: cs.paddingLeft,
          gap: cs.gap, display: cs.display, alignItems: cs.alignItems,
          justifyContent: cs.justifyContent, flexDir: cs.flexDirection,
          height: cs.height, zIndex: cs.zIndex, position: cs.position,
          fontSize: cs.fontSize, fontFamily: cs.fontFamily, color: hexify(cs.color),
          children,
          outerHTML: el.outerHTML.slice(0, 500),
        })
      })
    }
    return found
  })

  fs.writeFileSync(path.join(OUT, 'os-taskbar-win95.json'), JSON.stringify(taskbarWin95, null, 2))
  console.log(`  → ${taskbarWin95.length} éléments taskbar Win95`)

  // Screenshot taskbar si trouvée
  if (taskbarWin95.length > 0) {
    const tb = taskbarWin95[0].rect
    if (tb.w > 50 && tb.h > 0 && tb.y >= 0) {
      await page.screenshot({
        path: path.join(OUT, 'os-taskbar-crop.png'),
        clip: { x: Math.max(0, tb.x), y: Math.max(0, tb.y - 2), width: Math.min(1440, tb.w), height: Math.min(900, tb.h + 4) },
      })
      console.log(`  📸 Taskbar capturée (${tb.w}×${tb.h})`)
    }
  }

  await page.screenshot({ path: path.join(OUT, 'os-02-full.png') })

  // Cliquer sur un icône / START pour ouvrir une fenêtre
  console.log('  🖱 Tentative ouverture fenêtre…')
  const clickables = await page.evaluate(() =>
    Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const cs = window.getComputedStyle(el)
        const r  = el.getBoundingClientRect()
        return cs.cursor === 'pointer' && r.width > 10 && r.height > 10
      })
      .map(el => {
        const r = el.getBoundingClientRect()
        return { cls: (el.className||'').toString().slice(0,50), x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2) }
      })
      .slice(0, 4)
  )

  for (const c of clickables) {
    await page.mouse.click(c.x, c.y)
    await sleep(1200)
  }
  await sleep(2000)
  await page.screenshot({ path: path.join(OUT, 'os-03-with-windows.png') })

  // Re-analyser avec fenêtres ouvertes
  const windowOpen = await page.evaluate(() => {
    const hexify = rgb => {
      if (!rgb) return 'N/A'
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
      if (!m) return rgb
      return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
    }
    const results = []
    const seen = new Set()
    document.querySelectorAll('[class*="window"],[class*="Window"],[class*="win"]').forEach(el => {
      if (seen.has(el)) return; seen.add(el)
      const cs   = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      if (rect.width < 50) return
      results.push({
        cls: (el.className||'').toString().slice(0,80),
        rect: { w: Math.round(rect.width), h: Math.round(rect.height), x: Math.round(rect.x), y: Math.round(rect.y) },
        bg: hexify(cs.backgroundColor), boxShadow: cs.boxShadow,
        border: `T:${cs.borderTopWidth}/${hexify(cs.borderTopColor)} R:${cs.borderRightWidth}/${hexify(cs.borderRightColor)} B:${cs.borderBottomWidth}/${hexify(cs.borderBottomColor)} L:${cs.borderLeftWidth}/${hexify(cs.borderLeftColor)}`,
        backdropFilter: cs.backdropFilter,
        padding: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`,
        zIndex: cs.zIndex, position: cs.position,
        fontFamily: cs.fontFamily, fontSize: cs.fontSize,
        innerHTML: el.innerHTML.slice(0, 300),
      })
    })
    return results
  })

  fs.writeFileSync(path.join(OUT, 'os-window-open.json'), JSON.stringify(windowOpen, null, 2))
  console.log(`  → ${windowOpen.length} éléments window (fenêtres ouvertes)`)

  console.log('\n✅ Audit OS app terminé.')
  await browser.close()
})()
