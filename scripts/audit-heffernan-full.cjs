/**
 * audit-heffernan-full.cjs
 * Audit complet henryheffernan.com :
 *  1. Computed styles des fenêtres (box-shadow, backdrop-filter, border)
 *  2. Analyse bundle.js — librairies Window Management
 *  3. Capture + mesures précises de la Taskbar
 */

const puppeteer = require('puppeteer')
const fs        = require('fs')
const path      = require('path')

const OUT = path.join(__dirname, 'heffernan-analysis')
fs.mkdirSync(OUT, { recursive: true })

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Helpers ──────────────────────────────────────────────────────────────────

const px = v => (v == null ? 'N/A' : `${Math.round(parseFloat(v))}px`)

const hexify = rgb => {
  if (!rgb) return 'N/A'
  const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
  if (!m) return rgb
  const alpha = m[4] !== undefined ? ` a=${parseFloat(m[4]).toFixed(2)}` : ''
  return '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('') + alpha
}

;(async () => {
  console.log('🚀 Lancement Puppeteer…')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()

  // ── Intercepter les requêtes réseau pour trouver le bundle ──────────────
  const scriptUrls = []
  page.on('response', async (res) => {
    const url = res.url()
    if (url.includes('.js') && !url.includes('node_modules')) {
      scriptUrls.push(url)
    }
  })

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 1 — Chargement initial
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📡 Phase 1 — Chargement henryheffernan.com…')
  await page.goto('https://henryheffernan.com/', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(3000)

  // Screenshot initial
  await page.screenshot({ path: path.join(OUT, 'audit-01-initial.png') })
  console.log('  📸 Screenshot initial')

  // ── START button ────────────────────────────────────────────────────────
  console.log('  🖱 Clic START…')
  const startBtn = await page.$('.bios-start-button')
  if (startBtn) {
    await startBtn.click()
  } else {
    await page.mouse.click(720, 450)
  }

  console.log('  ⏳ Attente chargement scène 3D (20s)…')
  await sleep(20000)
  await page.screenshot({ path: path.join(OUT, 'audit-02-after-start.png') })
  console.log('  📸 Screenshot après START')

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 2 — Computed styles des fenêtres Win95
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🪟 Phase 2 — Computed styles fenêtres…')

  const windowStyles = await page.evaluate((hexifyStr) => {
    const hexify = new Function('rgb', hexifyStr)

    const keywords = [
      'window', 'Window', 'win95', 'win-', 'dialog', 'panel',
      'titlebar', 'title-bar', 'taskbar', 'desktop', 'frame',
    ]
    const seen    = new Set()
    const results = []

    keywords.forEach(kw => {
      document.querySelectorAll(`[class*="${kw}"]`).forEach(el => {
        if (seen.has(el)) return
        seen.add(el)

        const cs   = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()

        if (rect.width < 4 || rect.height < 4) return

        const sides = {}
        for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
          sides[side.toLowerCase()] = {
            width: cs[`border${side}Width`],
            style: cs[`border${side}Style`],
            color: hexify(cs[`border${side}Color`]),
          }
        }

        results.push({
          tag:            el.tagName,
          className:      (el.className || '').toString().slice(0, 80),
          id:             el.id || null,
          rect:           { w: Math.round(rect.width), h: Math.round(rect.height), x: Math.round(rect.x), y: Math.round(rect.y) },
          background:     hexify(cs.backgroundColor),
          color:          hexify(cs.color),
          boxShadow:      cs.boxShadow || 'none',
          backdropFilter: cs.backdropFilter || 'none',
          backgroundBlur: cs.filter       || 'none',
          borderImage:    cs.borderImage  || 'none',
          borders:        sides,
          padding:        {
            top:    cs.paddingTop,
            right:  cs.paddingRight,
            bottom: cs.paddingBottom,
            left:   cs.paddingLeft,
          },
          margin: {
            top:    cs.marginTop,
            right:  cs.marginRight,
            bottom: cs.marginBottom,
            left:   cs.marginLeft,
          },
          fontFamily: cs.fontFamily,
          fontSize:   cs.fontSize,
          fontWeight: cs.fontWeight,
          zIndex:     cs.zIndex,
          position:   cs.position,
          display:    cs.display,
          cursor:     cs.cursor,
        })
      })
    })
    return results
  }, `
    if (!rgb) return 'N/A'
    const m = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/)
    if (!m) return rgb
    return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
  `)

  fs.writeFileSync(path.join(OUT, 'audit-window-styles.json'), JSON.stringify(windowStyles, null, 2))
  console.log(`  → ${windowStyles.length} éléments analysés`)

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 3 — Analyse bundle.js — librairies Window Management
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📦 Phase 3 — Analyse bundle.js…')

  // Chercher le bundle principal
  const mainBundles = scriptUrls.filter(u =>
    u.includes('bundle') || u.includes('main') || u.includes('chunk') || u.includes('.js')
  )
  console.log(`  → ${mainBundles.length} scripts JS détectés`)

  const libSignatures = {
    'React':          ['react', 'createElement', 'useState', 'useEffect'],
    'React DOM':      ['ReactDOM', 'react-dom'],
    'Three.js':       ['THREE', 'WebGLRenderer', 'BufferGeometry', 'three'],
    'Framer Motion':  ['framer-motion', 'useAnimation', 'AnimatePresence', 'motion'],
    'Zustand':        ['zustand', 'create(', 'useStore'],
    'GSAP':           ['gsap', 'TweenLite', 'TweenMax', 'TimelineMax'],
    'React Spring':   ['react-spring', 'useSpring', 'animated'],
    'Interact.js':    ['interact', 'interactjs', 'Interact'],
    'react-rnd':      ['react-rnd', 'Rnd', 'DraggableResizable'],
    'react-draggable':['react-draggable', 'DraggableCore'],
    'react-resizable':['react-resizable', 'ResizableBox'],
    'CSS3D / Three':  ['CSS3DRenderer', 'CSS3DObject', 'CSS3DSprite'],
    'Leva':           ['leva', 'useControls'],
    'dat.GUI':        ['dat.GUI', 'datgui'],
    'Recoil':         ['recoil', 'atom(', 'useRecoilState'],
    'Redux':          ['redux', 'createStore', 'useSelector', 'useDispatch'],
    'MobX':           ['mobx', 'observable', 'makeObservable'],
    'React Query':    ['react-query', 'useQuery', 'QueryClient'],
    'axios':          ['axios', 'axios.get', 'axios.post'],
    'Emotion/SC':     ['emotion', 'styled-components', 'css-in-js'],
    'Tailwind':       ['tailwindcss', 'tw-'],
    'Vite/CRA':       ['@vitejs', 'create-react-app', 'vite'],
    'Next.js':        ['next/router', '__NEXT_DATA__'],
    'TypeScript':     ['__importStar', 'tslib'],
  }

  const bundleFindings = {}
  const bundleTexts    = {}

  for (const url of mainBundles.slice(0, 8)) {
    try {
      const text = await page.evaluate(async (u) => {
        const r = await fetch(u)
        return r.ok ? (await r.text()).slice(0, 800000) : null
      }, url)

      if (!text) continue

      const shortUrl = url.split('/').slice(-2).join('/')
      bundleTexts[shortUrl] = text.slice(0, 2000) // aperçu

      const found = {}
      for (const [lib, sigs] of Object.entries(libSignatures)) {
        const hits = sigs.filter(s => text.includes(s))
        if (hits.length) found[lib] = hits
      }

      bundleFindings[shortUrl] = {
        url,
        size_chars: text.length,
        libraries_detected: found,
      }

      console.log(`  📄 ${shortUrl} (${Math.round(text.length / 1024)}KB) — ${Object.keys(found).join(', ') || 'rien détecté'}`)
    } catch (e) {
      console.log(`  ⚠ Erreur fetch ${url}: ${e.message}`)
    }
  }

  fs.writeFileSync(path.join(OUT, 'audit-bundle-analysis.json'), JSON.stringify(bundleFindings, null, 2))

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 4 — Taskbar : capture + mesures précises
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n📏 Phase 4 — Analyse Taskbar…')

  const taskbarData = await page.evaluate((hexifyStr) => {
    const hexify = new Function('rgb', hexifyStr)

    // Chercher la taskbar par divers sélecteurs
    const selectors = [
      '[class*="taskbar"]', '[class*="Taskbar"]', '[class*="task-bar"]',
      '[class*="toolbar"]', '[class*="status-bar"]', '[class*="statusbar"]',
      '[class*="bottom-bar"]', '[class*="footer"]',
    ]

    const results = []
    const seen    = new Set()

    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => {
        if (seen.has(el)) return
        seen.add(el)

        const cs   = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()

        if (rect.width < 50) return

        // Mesurer tous les enfants directs
        const children = Array.from(el.children).map(child => {
          const cr    = child.getBoundingClientRect()
          const ccs   = window.getComputedStyle(child)
          return {
            tag:        child.tagName,
            className:  (child.className || '').toString().slice(0, 60),
            text:       child.textContent.trim().slice(0, 40),
            rect:       { w: Math.round(cr.width), h: Math.round(cr.height), x: Math.round(cr.x), y: Math.round(cr.y) },
            padding:    {
              top:    ccs.paddingTop,
              right:  ccs.paddingRight,
              bottom: ccs.paddingBottom,
              left:   ccs.paddingLeft,
            },
            margin:     {
              top:    ccs.marginTop,
              right:  ccs.marginRight,
              bottom: ccs.marginBottom,
              left:   ccs.marginLeft,
            },
            gap:        ccs.gap,
            background: hexify(ccs.backgroundColor),
            fontSize:   ccs.fontSize,
            fontFamily: ccs.fontFamily,
            display:    ccs.display,
            flexDir:    ccs.flexDirection,
            alignItems: ccs.alignItems,
            cursor:     ccs.cursor,
          }
        })

        results.push({
          selector:       sel,
          tag:            el.tagName,
          className:      (el.className || '').toString().slice(0, 80),
          rect:           { w: Math.round(rect.width), h: Math.round(rect.height), x: Math.round(rect.x), y: Math.round(rect.y) },
          background:     hexify(cs.backgroundColor),
          boxShadow:      cs.boxShadow || 'none',
          padding:        { top: cs.paddingTop, right: cs.paddingRight, bottom: cs.paddingBottom, left: cs.paddingLeft },
          gap:            cs.gap,
          display:        cs.display,
          alignItems:     cs.alignItems,
          justifyContent: cs.justifyContent,
          flexDir:        cs.flexDirection,
          zIndex:         cs.zIndex,
          position:       cs.position,
          fontSize:       cs.fontSize,
          fontFamily:     cs.fontFamily,
          color:          hexify(cs.color),
          children,
        })
      })
    }
    return results
  }, `
    if (!rgb) return 'N/A'
    const m = rgb.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/)
    if (!m) return rgb
    return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
  `)

  fs.writeFileSync(path.join(OUT, 'audit-taskbar.json'), JSON.stringify(taskbarData, null, 2))
  console.log(`  → ${taskbarData.length} éléments taskbar trouvés`)

  // Capture ciblée de la taskbar
  if (taskbarData.length > 0) {
    const tb = taskbarData[0].rect
    if (tb.w > 50 && tb.h > 0) {
      try {
        await page.screenshot({
          path: path.join(OUT, 'audit-taskbar-crop.png'),
          clip: {
            x: Math.max(0, tb.x - 4),
            y: Math.max(0, tb.y - 4),
            width:  Math.min(1440, tb.w + 8),
            height: Math.min(900,  tb.h + 8),
          },
        })
        console.log(`  📸 Screenshot taskbar (${tb.w}×${tb.h} @ ${tb.x},${tb.y})`)
      } catch (e) {
        console.log('  ⚠ Capture taskbar échouée:', e.message)
      }
    }
  }

  // Screenshot final global
  await page.screenshot({ path: path.join(OUT, 'audit-03-final.png') })

  // ─────────────────────────────────────────────────────────────────────────
  // PHASE 5 — CSS Variables et @font-face
  // ─────────────────────────────────────────────────────────────────────────
  console.log('\n🎨 Phase 5 — CSS Variables & polices…')

  const cssVarsAndFonts = await page.evaluate(() => {
    const vars  = {}
    const faces = []

    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.style) {
            for (const prop of rule.style) {
              if (prop.startsWith('--')) vars[prop] = rule.style.getPropertyValue(prop).trim()
            }
          }
          if (rule.constructor.name === 'CSSFontFaceRule') faces.push(rule.cssText)
        }
      } catch { /* CORS */ }
    }
    return { vars, faces }
  })

  fs.writeFileSync(path.join(OUT, 'audit-css-vars-fonts.json'), JSON.stringify(cssVarsAndFonts, null, 2))

  // ─────────────────────────────────────────────────────────────────────────
  // RAPPORT CONSOLIDÉ
  // ─────────────────────────────────────────────────────────────────────────

  const report = {
    generated_at: new Date().toISOString(),
    url: 'https://henryheffernan.com/',
    window_styles: windowStyles,
    bundle_analysis: bundleFindings,
    taskbar: taskbarData,
    css_vars: cssVarsAndFonts.vars,
    fonts: cssVarsAndFonts.faces,
  }

  fs.writeFileSync(path.join(OUT, 'audit-full-report.json'), JSON.stringify(report, null, 2))

  console.log('\n✅ Analyse complète. Fichiers sauvegardés dans :', OUT)
  await browser.close()

  return report
})()
