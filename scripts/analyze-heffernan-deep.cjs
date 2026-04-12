/**
 * analyze-heffernan-deep.cjs
 * Clique sur START → attend le chargement 3D → capture les fenêtres Win95 CSS3D
 */

const puppeteer = require('puppeteer')
const fs        = require('fs')
const path      = require('path')

const OUT = path.join(__dirname, 'heffernan-analysis')
fs.mkdirSync(OUT, { recursive: true })

const sleep = ms => new Promise(r => setTimeout(r, ms))

const hexify = rgb => {
  const m = rgb?.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return rgb || ''
  return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
}

;(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1440, height: 900 },
  })
  const page = await browser.newPage()

  console.log('📡 Chargement…')
  await page.goto('https://henryheffernan.com/', { waitUntil: 'networkidle2', timeout: 30000 })
  await sleep(3000)

  // ── Clic sur le bouton START ─────────────────────────────────────
  console.log('🖱 Clic START…')
  const startBtn = await page.$('.bios-start-button')
  if (startBtn) {
    await startBtn.click()
    console.log('  ✓ START cliqué')
  } else {
    // Fallback : clic au centre du dialog
    await page.mouse.click(694, 460)
    console.log('  ✓ Clic centre (fallback)')
  }

  // Attendre le chargement de la scène 3D (loading screen + WebGL init)
  console.log('⏳ Attente chargement scène 3D (15s)…')
  await sleep(15000)
  await page.screenshot({ path: path.join(OUT, '10-after-start.png') })
  console.log('📸 Screenshot après START')

  // ── Analyser TOUT le DOM après chargement ──────────────────────
  console.log('🌳 Analyse DOM post-chargement…')

  const fullDOM = await page.evaluate((hexifyStr) => {
    // Re-déclarer hexify dans le contexte browser
    const hexify = new Function('rgb', hexifyStr)

    function serializeEl(el, depth = 0) {
      if (depth > 8) return null
      const cs   = window.getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      const attrs = {}
      for (const a of el.attributes) attrs[a.name] = a.value

      return {
        tag:      el.tagName,
        id:       el.id || undefined,
        classes:  el.className || undefined,
        attrs,
        rect:     { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        style: {
          bg:          hexify(cs.backgroundColor),
          color:       hexify(cs.color),
          borderT:     `${cs.borderTopWidth} ${cs.borderTopStyle} ${hexify(cs.borderTopColor)}`,
          borderR:     `${cs.borderRightWidth} ${cs.borderRightStyle} ${hexify(cs.borderRightColor)}`,
          borderB:     `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${hexify(cs.borderBottomColor)}`,
          borderL:     `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${hexify(cs.borderLeftColor)}`,
          font:        cs.fontFamily,
          fontSize:    cs.fontSize,
          fontWeight:  cs.fontWeight,
          boxShadow:   cs.boxShadow,
          zIndex:      cs.zIndex,
          position:    cs.position,
          transform:   cs.transform?.slice(0, 60),
          display:     cs.display,
          padding:     cs.padding,
          cursor:      cs.cursor,
        },
        text:     el.childElementCount === 0 ? el.textContent.trim().slice(0, 80) : undefined,
        children: Array.from(el.children).map(c => serializeEl(c, depth + 1)).filter(Boolean),
      }
    }
    return serializeEl(document.body)
  }, `
    const m = rgb?.match(/rgba?\\((\\d+),\\s*(\\d+),\\s*(\\d+)/)
    if (!m) return rgb || ''
    return '#' + [m[1],m[2],m[3]].map(n => parseInt(n).toString(16).padStart(2,'0')).join('')
  `)

  fs.writeFileSync(path.join(OUT, 'full-dom-post-start.json'), JSON.stringify(fullDOM, null, 2))

  // ── Chercher tous les éléments avec un transform 3D (CSS3D) ──────
  console.log('🧊 Éléments CSS3D transform…')
  const css3dElements = await page.evaluate(() => {
    const results = []
    document.querySelectorAll('*').forEach(el => {
      const cs = window.getComputedStyle(el)
      if (cs.transform && cs.transform !== 'none' && cs.transform.includes('matrix')) {
        const rect = el.getBoundingClientRect()
        results.push({
          tag:       el.tagName,
          id:        el.id,
          classes:   el.className,
          transform: cs.transform.slice(0, 80),
          zIndex:    cs.zIndex,
          bg:        cs.backgroundColor,
          border:    cs.border,
          font:      cs.fontFamily,
          rect:      { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
          innerHTML: el.innerHTML.slice(0, 400),
        })
      }
    })
    return results
  })
  fs.writeFileSync(path.join(OUT, 'css3d-elements.json'), JSON.stringify(css3dElements, null, 2))
  console.log(`  → ${css3dElements.length} éléments avec CSS transform`)

  // ── Chercher tous les styles inline (style= sur les div) ─────────
  console.log('🎨 Styles inline post-chargement…')
  const inlineStyleEls = await page.evaluate(() => {
    const results = []
    document.querySelectorAll('[style]').forEach(el => {
      const rect = el.getBoundingClientRect()
      if (rect.width < 5 && rect.height < 5) return // skip invisible
      results.push({
        tag:        el.tagName,
        id:         el.id,
        classes:    el.className,
        style_attr: el.getAttribute('style'),
        computed_bg:     window.getComputedStyle(el).backgroundColor,
        computed_border: window.getComputedStyle(el).border,
        computed_font:   window.getComputedStyle(el).fontFamily,
        computed_z:      window.getComputedStyle(el).zIndex,
        rect:       { x: Math.round(rect.x), y: Math.round(rect.y), w: Math.round(rect.width), h: Math.round(rect.height) },
        innerHTML:  el.innerHTML.slice(0, 300),
      })
    })
    return results
  })
  fs.writeFileSync(path.join(OUT, 'inline-style-elements.json'), JSON.stringify(inlineStyleEls, null, 2))
  console.log(`  → ${inlineStyleEls.length} éléments avec style inline`)

  // ── Chercher les styles dans les <style> rechargés ────────────────
  const newStyles = await page.evaluate(() =>
    Array.from(document.querySelectorAll('style')).map(s => s.textContent)
  )
  fs.writeFileSync(path.join(OUT, 'styles-post-start.txt'), newStyles.join('\n\n/* ─── */\n\n'))

  // ── Nouvelles CSS sheets chargées ─────────────────────────────────
  const newSheets = await page.evaluate(() => {
    const out = []
    for (const sheet of document.styleSheets) {
      try {
        const rules = Array.from(sheet.cssRules).map(r => r.cssText)
        out.push({ href: sheet.href ?? 'inline', count: rules.length, rules })
      } catch { out.push({ href: sheet.href ?? 'inline', count: 0, rules: ['/* blocked */'] }) }
    }
    return out
  })
  fs.writeFileSync(path.join(OUT, 'sheets-post-start.json'), JSON.stringify(newSheets, null, 2))

  // ── Interactions : cliquer sur les éléments de la scène ──────────
  console.log('🖱 Interactions sur la scène 3D…')

  // Chercher des boutons/icônes visibles
  const interactables = await page.evaluate(() =>
    Array.from(document.querySelectorAll('*'))
      .filter(el => {
        const cs = window.getComputedStyle(el)
        const r  = el.getBoundingClientRect()
        return cs.cursor === 'pointer' && r.width > 5 && r.height > 5
      })
      .map(el => {
        const r = el.getBoundingClientRect()
        return {
          tag: el.tagName, cls: el.className.slice(0,50), id: el.id,
          x: Math.round(r.x + r.width/2), y: Math.round(r.y + r.height/2),
          html: el.outerHTML.slice(0, 150),
        }
      })
  )
  fs.writeFileSync(path.join(OUT, 'clickable-elements.json'), JSON.stringify(interactables, null, 2))
  console.log(`  → ${interactables.length} éléments cliquables (cursor:pointer)`)

  // Cliquer sur les 6 premiers
  for (let i = 0; i < Math.min(interactables.length, 6); i++) {
    const t = interactables[i]
    console.log(`  Clic [${t.cls || t.id || t.tag}] (${t.x},${t.y})`)
    await page.mouse.click(t.x, t.y)
    await sleep(1500)
    await page.screenshot({ path: path.join(OUT, `1${i}-interact-${i}.png`) })

    // Capturer les nouveaux éléments apparus
    const snapshot = await page.evaluate(() =>
      Array.from(document.querySelectorAll('[style]'))
        .filter(el => {
          const r = el.getBoundingClientRect()
          return r.width > 50 && r.height > 50
        })
        .map(el => ({
          cls:    el.className.slice(0,60),
          style:  el.getAttribute('style').slice(0,200),
          z:      window.getComputedStyle(el).zIndex,
          bg:     window.getComputedStyle(el).backgroundColor,
          border: window.getComputedStyle(el).border,
          html:   el.innerHTML.slice(0,300),
        }))
    )
    fs.writeFileSync(path.join(OUT, `snapshot-after-click-${i}.json`), JSON.stringify(snapshot, null, 2))
  }

  // Screenshot final
  await sleep(2000)
  await page.screenshot({ path: path.join(OUT, '20-final.png') })

  // ── RAPPORT TERMINAL ─────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════')
  console.log('  RAPPORT DEEP — post-START')
  console.log('═══════════════════════════════════════════════\n')

  console.log('── Éléments CSS3D (transform matrix) ──')
  css3dElements.slice(0, 15).forEach(e => {
    console.log(`\n  [${e.tag}${e.classes ? '.'+e.classes.trim().slice(0,40) : ''}]`)
    console.log(`    transform: ${e.transform}`)
    console.log(`    bg=${e.bg}  border=${e.border?.slice(0,50)}  z=${e.zIndex}`)
    console.log(`    font: ${e.font}`)
    console.log(`    HTML: ${e.innerHTML.slice(0,120).replace(/\n/g,' ')}`)
  })

  console.log('\n── Éléments style inline (visibles, > 5×5px) ──')
  inlineStyleEls.slice(0, 20).forEach(e => {
    console.log(`\n  [${e.tag}.${e.classes?.slice(0,40)}]  ${e.rect.w}×${e.rect.h}`)
    console.log(`    style="${e.style_attr?.slice(0,120)}"`)
    console.log(`    bg=${e.computed_bg}  border=${e.computed_border?.slice(0,60)}`)
    console.log(`    font=${e.computed_font}  z=${e.computed_z}`)
    console.log(`    HTML: ${e.innerHTML.slice(0,100).replace(/\n/g,' ')}`)
  })

  console.log('\n── CSS ajouté post-chargement ──')
  newSheets.forEach(s => {
    if (s.count > 0) {
      console.log(`\n  Sheet: ${s.href || 'inline'} (${s.count} règles)`)
      s.rules.slice(0, 30).forEach(r => console.log('   ', r.slice(0,120)))
    }
  })

  console.log('\n── Éléments cliquables (cursor:pointer) ──')
  interactables.slice(0, 10).forEach(e =>
    console.log(`  [${e.cls || e.id || e.tag}] (${e.x},${e.y}) — ${e.html.slice(0,80).replace(/\n/g,' ')}`)
  )

  console.log('\n✅ Terminé. Fichiers :', OUT)
  await browser.close()
})()
