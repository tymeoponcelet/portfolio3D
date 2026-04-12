/**
 * extract-style-tokens.cjs
 * Extrait les design tokens de os.henryheffernan.com
 * → Couleurs exactes, dimensions CSS, typographie, effets
 * Sortie : style-tokens.json à la racine du projet
 */

const puppeteer = require('puppeteer')
const fs        = require('fs')
const path      = require('path')

const OUT = path.join(__dirname, '..', 'style-tokens.json')

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

  /* ── Extraction complète des tokens ── */
  const tokens = await page.evaluate(() => {
    const hexify = (rgb) => {
      if (!rgb || rgb === 'transparent') return null
      const m = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/)
      if (!m) return rgb
      const hex = '#' + [m[1], m[2], m[3]].map(n => parseInt(n).toString(16).padStart(2, '0')).join('')
      return hex
    }

    // ── CSS Custom Properties depuis :root / [data-theme] ──────────────
    const cssVars = {}
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.selectorText && (rule.selectorText.includes(':root') || rule.selectorText === 'html')) {
            for (const prop of rule.style) {
              if (prop.startsWith('--')) {
                cssVars[prop] = rule.style.getPropertyValue(prop).trim()
              }
            }
          }
        }
      } catch { /* CORS */ }
    }

    // ── Palette de couleurs via computed styles des éléments clés ──────

    // Desktop background
    const desktopEl = document.querySelector('[class*="desktop"],[class*="Desktop"]')
    const desktopBg = desktopEl ? hexify(window.getComputedStyle(desktopEl).backgroundColor) : '#008080'

    // Fenêtre active — titlebar
    const allTitlebars = Array.from(document.querySelectorAll('[class*="titlebar"],[class*="title-bar"],[class*="TitleBar"]'))
    let titlebarActive = null, titlebarInactive = null, titlebarBgFull = null
    if (allTitlebars.length > 0) {
      const cs = window.getComputedStyle(allTitlebars[0])
      titlebarActive   = hexify(cs.backgroundColor)
      titlebarBgFull   = cs.background.slice(0, 200)
      titlebarInactive = '#808080' // Win95 standard
    }

    // Surface (silver)
    const windowEl = document.querySelector('[class*="window"],[class*="Window"]')
    const surfaceBg = windowEl ? hexify(window.getComputedStyle(windowEl).backgroundColor) : '#c0c0c0'

    // Boutons titlebar
    const ctrlBtn = document.querySelector('[class*="control"],[class*="ctrl"],[class*="button"]')
    const btnBg   = ctrlBtn ? hexify(window.getComputedStyle(ctrlBtn).backgroundColor) : '#c0c0c0'
    const btnShadow   = ctrlBtn ? window.getComputedStyle(ctrlBtn).boxShadow : null

    // ── Dimensions CSS ──────────────────────────────────────────────────

    // Titlebar height
    const titlebarHeight = allTitlebars.length > 0
      ? Math.round(allTitlebars[0].getBoundingClientRect().height)
      : 18

    // Taskbar
    const taskbarEl = document.querySelector('[class*="taskbar"],[class*="Taskbar"],[class*="task-bar"]')
    const taskbarHeight = taskbarEl
      ? Math.round(taskbarEl.getBoundingClientRect().height)
      : 28

    // Fenêtre — border thickness
    const windowBorder = windowEl ? window.getComputedStyle(windowEl).borderTopWidth : '2px'

    // Padding interne fenêtre
    const bodyEl = document.querySelector('[class*="body"],[class*="Body"],[class*="content"],[class*="Content"]')
    const bodyPadding = bodyEl ? window.getComputedStyle(bodyEl).padding : '2px'

    // Icônes bureau
    const iconEls = document.querySelectorAll('[class*="icon"],[class*="Icon"],[class*="shortcut"]')
    let iconSize = 48, iconSpacing = 104
    if (iconEls.length >= 2) {
      const r1 = iconEls[0].getBoundingClientRect()
      const r2 = iconEls[1].getBoundingClientRect()
      iconSize    = Math.round(Math.max(r1.width, r1.height))
      iconSpacing = Math.round(Math.abs(r2.y - r1.y))
    }

    // Boutons titlebar — dimensions
    const ctrlBtns = document.querySelectorAll('[class*="control"],[class*="ctrl"],[class*="min-btn"],[class*="max-btn"],[class*="close-btn"]')
    let ctrlBtnW = 16, ctrlBtnH = 14
    if (ctrlBtns.length > 0) {
      const r = ctrlBtns[0].getBoundingClientRect()
      ctrlBtnW = Math.round(r.width)
      ctrlBtnH = Math.round(r.height)
    }

    // ── Typographie ─────────────────────────────────────────────────────
    const uiEl     = document.querySelector('[class*="titlebar"],[class*="taskbar"],[class*="button"]')
    const bodyFont = uiEl ? window.getComputedStyle(uiEl).fontFamily : 'MSSansSerif, MS Sans Serif, Arial'
    const bodySize = uiEl ? window.getComputedStyle(uiEl).fontSize    : '11px'

    const pEls = document.querySelectorAll('p')
    const pFont = pEls.length > 0 ? window.getComputedStyle(pEls[0]).fontFamily : null
    const pSize = pEls.length > 0 ? window.getComputedStyle(pEls[0]).fontSize    : null

    const h1Els = document.querySelectorAll('h1')
    const h1Font = h1Els.length > 0 ? window.getComputedStyle(h1Els[0]).fontFamily : null
    const h1Size = h1Els.length > 0 ? window.getComputedStyle(h1Els[0]).fontSize    : null

    // ── Box-Shadow des fenêtres ─────────────────────────────────────────
    const winBoxShadow = windowEl ? window.getComputedStyle(windowEl).boxShadow : null
    const titleBtnBoxShadow = ctrlBtn ? window.getComputedStyle(ctrlBtn).boxShadow : null

    // ── Taskbar : gradient ou couleur ──────────────────────────────────
    const taskbarBg    = taskbarEl ? window.getComputedStyle(taskbarEl).background.slice(0, 300) : null
    const taskbarBgHex = taskbarEl ? hexify(window.getComputedStyle(taskbarEl).backgroundColor) : null

    return {
      cssVars,
      colors: {
        desktop:           desktopBg,
        surface:           surfaceBg,
        titlebarActive:    titlebarActive,
        titlebarInactive:  titlebarInactive,
        titlebarBgFull:    titlebarBgFull,
        buttonFace:        btnBg,
        highlight:         '#ffffff',   // Win95 standard — bord haut-gauche
        shadow:            '#808080',   // Win95 standard — bord bas-droite
        frame:             '#2b2b2b',   // cadre sombre extérieur
        inputActive:       '#fbffc4',   // jaune pâle — input focus
        taskbarBg:         taskbarBgHex,
        taskbarBgFull:     taskbarBg,
        selectionBg:       '#000080',
        windowText:        '#000000',
      },
      dimensions: {
        titlebarHeight:    `${titlebarHeight}px`,
        taskbarHeight:     `${taskbarHeight}px`,
        windowBorder:      windowBorder,
        windowPadding:     bodyPadding,
        ctrlBtnWidth:      `${ctrlBtnW}px`,
        ctrlBtnHeight:     `${ctrlBtnH}px`,
        iconSize:          `${iconSize}px`,
        iconVertSpacing:   `${iconSpacing}px`,
        iconLeftMargin:    '24px',
        windowMinWidth:    '180px',
        windowMinHeight:   '100px',
      },
      typography: {
        uiFont:    bodyFont,
        uiSize:    bodySize,
        monoFont:  '"Courier New", Courier, monospace',
        bodyFont:  pFont ?? 'Millennium, Times New Roman, serif',
        bodySize:  pSize ?? '18px',
        titleFont: h1Font ?? 'gastromond, sans-serif',
        titleSize: h1Size ?? '64px',
        toolbarFont: 'lores-15-bold-alt-oakland, sans-serif',
        toolbarSize: '18px',
      },
      effects: {
        windowBoxShadow: winBoxShadow,
        ctrlBtnBoxShadow: titleBtnBoxShadow,
        borderRaised: [
          'inset  1px  1px #ffffff',   /* highlight haut-gauche */
          'inset  2px  2px #747474',   /* face médiane */
          'inset -1px -1px #2b2b2b',   /* cadre extérieur */
          'inset -2px -2px #808080',   /* ombre bas-droite */
        ].join(', '),
        borderSunken: [
          'inset  1px  1px #808080',
          'inset  2px  2px #2b2b2b',
          'inset -1px -1px #ffffff',
          'inset -2px -2px #747474',
        ].join(', '),
        borderField: [
          'inset -1px -1px #ffffff',
          'inset  1px  1px #808080',
          'inset -2px -2px #747474',
          'inset  2px  2px #2b2b2b',
        ].join(', '),
        backdropFilter:  'none',    /* Heffernan : zéro glassmorphism */
        desktopScanlines: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, rgba(0,0,0,0.05) 1px, rgba(0,0,0,0.05) 2px)',
        crtJitter: 'jittery 0.3s ease-in-out infinite',
      },
    }
  })

  fs.writeFileSync(OUT, JSON.stringify(tokens, null, 2))
  console.log(`\n✅ style-tokens.json créé : ${OUT}`)

  // Vérification rapide
  console.log('\n── Couleurs extraites ──────────────────────────')
  Object.entries(tokens.colors).forEach(([k, v]) => {
    if (v && !k.includes('Full')) console.log(`  ${k.padEnd(22)} ${v}`)
  })
  console.log('\n── Dimensions ─────────────────────────────────')
  Object.entries(tokens.dimensions).forEach(([k, v]) => console.log(`  ${k.padEnd(22)} ${v}`))
  console.log('\n── Typographie ─────────────────────────────────')
  Object.entries(tokens.typography).forEach(([k, v]) => {
    if (v) console.log(`  ${k.padEnd(22)} ${String(v).slice(0, 60)}`)
  })

  await browser.close()
})()
