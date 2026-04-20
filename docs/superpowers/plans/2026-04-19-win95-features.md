# Win95 Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four authentic Windows 95 features — sound engine, BSOD, right-click context menu, and pixelated cursors — to the existing portfolio OS.

**Architecture:** A singleton sound module (`win95sounds.js`) is imported directly by components. BSOD state lives in `osStore`. BSOD and SafeToTurnOff are overlay components rendered at the top of OS.jsx's AnimatePresence. The context menu lives in Desktop.jsx as a local state + ContextMenu component. Cursors are pure CSS data URIs in win95.css.

**Tech Stack:** React 18, Zustand, Framer Motion, Web Audio API, CSS cursor data URIs

---

## File Map

| Action | File |
|--------|------|
| Create | `src/utils/win95sounds.js` |
| Create | `src/components/OS/BSOD.jsx` |
| Create | `src/components/OS/SafeToTurnOff.jsx` |
| Create | `src/components/OS/ContextMenu.jsx` |
| Modify | `src/stores/osStore.js` |
| Modify | `src/components/OS/OS.jsx` |
| Modify | `src/components/OS/Desktop.jsx` |
| Modify | `src/components/Window/Window.jsx` |
| Modify | `src/components/OS/Taskbar.jsx` |
| Modify | `src/styles/win95.css` |

---

## Task 1: Sound Engine

**Files:**
- Create: `src/utils/win95sounds.js`

- [ ] **Step 1: Create the sound module**

```js
// src/utils/win95sounds.js
let _ctx = null

function ctx() {
  if (!_ctx) _ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function tone(freq, dur, type = 'square', vol = 0.25) {
  try {
    const c = ctx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.connect(gain)
    gain.connect(c.destination)
    osc.type = type
    osc.frequency.value = freq
    gain.gain.setValueAtTime(vol, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur)
    osc.start(c.currentTime)
    osc.stop(c.currentTime + dur)
  } catch (_) {}
}

export const win95sounds = {
  click:    () => tone(800, 0.05, 'sine', 0.12),
  open:     () => { tone(600, 0.08, 'sine', 0.18); setTimeout(() => tone(900, 0.06, 'sine', 0.14), 60) },
  close:    () => { tone(900, 0.06, 'sine', 0.18); setTimeout(() => tone(600, 0.08, 'sine', 0.13), 50) },
  minimize: () => { tone(700, 0.06, 'sine', 0.12); setTimeout(() => tone(500, 0.07, 'sine', 0.10), 50) },
  error:    () => { tone(300, 0.15, 'square', 0.3); setTimeout(() => tone(250, 0.2, 'square', 0.25), 170) },
  bsod:     () => tone(180, 1.0, 'square', 0.35),
  startup:  () => {
    try {
      const a = new Audio('/sounds/startup.mp3')
      a.volume = 0.6
      a.play().catch(() => {})
    } catch (_) {}
  },
}
```

- [ ] **Step 2: Verify the module loads without errors**

Start the dev server (`npm run dev` in `portfolio-3d/`) and open the OS page. Open the browser console — there should be no import errors.

- [ ] **Step 3: Commit**

```bash
git add src/utils/win95sounds.js
git commit -m "feat: add Win95 sound engine (Web Audio API + startup.mp3)"
```

---

## Task 2: BSOD state in osStore

**Files:**
- Modify: `src/stores/osStore.js`

- [ ] **Step 1: Add BSOD fields to the store**

In `src/stores/osStore.js`, inside the returned object (after `numShutdowns: 0,`), add:

```js
isBSOD: false,
triggerBSOD: () => set({ isBSOD: true }),
clearBSOD:   () => set({ isBSOD: false }),
```

The final block should look like:

```js
isShutdown: false,
numShutdowns: 0,
isBSOD: false,
triggerBSOD: () => set({ isBSOD: true }),
clearBSOD:   () => set({ isBSOD: false }),
```

- [ ] **Step 2: Commit**

```bash
git add src/stores/osStore.js
git commit -m "feat: add BSOD state to osStore"
```

---

## Task 3: BSOD and SafeToTurnOff components

**Files:**
- Create: `src/components/OS/BSOD.jsx`
- Create: `src/components/OS/SafeToTurnOff.jsx`

- [ ] **Step 1: Create BSOD component**

```jsx
// src/components/OS/BSOD.jsx
import { useEffect } from 'react'
import { win95sounds } from '../../utils/win95sounds'

const TEXT = `Un problème grave a été détecté et Windows a été arrêté pour éviter
tout dommage à votre ordinateur.

EXCEPTION_NOT_HANDLED

Si c'est la première fois que vous voyez cet écran, redémarrez
votre ordinateur. Si l'écran réapparaît, procédez comme suit :

Vérifiez que tout nouveau matériel ou logiciel est correctement
installé. Si c'est une nouvelle installation, demandez au fabricant
du matériel ou du logiciel les mises à jour Windows nécessaires.

Si les problèmes persistent, désactivez ou supprimez tout nouveau
matériel ou logiciel. Désactivez les options mémoire du BIOS telles
que la mise en cache ou la création d'ombres.

Informations techniques :

*** STOP: 0x0000000E (0xC0000005, 0xBFF7B4D2, 0x00000000, 0x00000002)

*** address BFF7B4D2 base at BFF70000, DateStamp 3640e7c7 — win32k.sys


Début du vidage de la mémoire physique
Vidage de la mémoire physique terminé.
Contactez votre administrateur système ou l'assistance technique.`

export function BSOD({ onRecover }) {
  useEffect(() => {
    win95sounds.bsod()
    const dismiss = () => { clearTimeout(tid); onRecover() }
    const tid = setTimeout(onRecover, 8000)
    window.addEventListener('click',   dismiss, { once: true })
    window.addEventListener('keydown', dismiss, { once: true })
    return () => {
      clearTimeout(tid)
      window.removeEventListener('click',   dismiss)
      window.removeEventListener('keydown', dismiss)
    }
  }, [onRecover])

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 999999,
      background: '#0000AA', color: '#ffffff',
      fontFamily: '"Courier New", Courier, monospace',
      fontSize: 13, padding: '36px 48px',
      lineHeight: 1.65, cursor: 'wait',
    }}>
      <div style={{
        display: 'inline-block',
        background: '#aaaaaa', color: '#0000AA',
        padding: '1px 8px', marginBottom: 18,
        fontWeight: 'bold', fontSize: 13,
      }}>
        Windows
      </div>
      <pre style={{
        fontFamily: 'inherit', fontSize: 'inherit',
        whiteSpace: 'pre-wrap', margin: 0, color: '#ffffff',
      }}>
        {TEXT}
      </pre>
      <p style={{ marginTop: 24, fontSize: 12, opacity: 0.75 }}>
        Appuyez sur une touche ou cliquez pour redémarrer…
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Create SafeToTurnOff component**

```jsx
// src/components/OS/SafeToTurnOff.jsx
import { useEffect } from 'react'

export function SafeToTurnOff({ onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 999998,
      background: '#000000',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#008080', color: '#ffffff',
        fontFamily: '"MS Sans Serif", Tahoma, Arial, sans-serif',
        fontSize: 14, padding: '20px 40px',
        border: '2px solid #ffffff', textAlign: 'center',
      }}>
        Il est maintenant possible d'éteindre votre ordinateur.
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/BSOD.jsx src/components/OS/SafeToTurnOff.jsx
git commit -m "feat: add BSOD and SafeToTurnOff components"
```

---

## Task 4: Wire BSOD, SafeToTurnOff and startup sound into OS.jsx

**Files:**
- Modify: `src/components/OS/OS.jsx`

- [ ] **Step 1: Replace the full OS.jsx content**

The new OS.jsx adds:
1. Import BSOD, SafeToTurnOff, win95sounds
2. Subscribe to `isBSOD`, `triggerBSOD`, `clearBSOD` from store
3. Local state `showSafe` for the safe-to-turn-off screen
4. BSOD random timer (every 30 s, 2% chance, only when desktop is active)
5. Play startup sound when `booted` becomes true
6. `onComplete` of ShutdownSequence now sets `showSafe = true` instead of calling `completeShutdown` directly
7. BSOD overlay in AnimatePresence (highest key priority)

```jsx
// src/components/OS/OS.jsx
import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence }                  from 'framer-motion'
import { Desktop }                                  from './Desktop'
import { ShutdownSequence }                         from './ShutdownSequence'
import { BSOD }                                     from './BSOD'
import { SafeToTurnOff }                            from './SafeToTurnOff'
import { useOSStore }                               from '../../stores/osStore'
import { win95sounds }                              from '../../utils/win95sounds'
import '../../styles/win95.css'

const BOOT_STEPS = [
  { pct: 15,  label: 'Chargement des pilotes…'     },
  { pct: 35,  label: 'Initialisation du registre…' },
  { pct: 55,  label: 'Démarrage des services…'      },
  { pct: 75,  label: "Chargement de l'interface…"  },
  { pct: 95,  label: 'Préparation du bureau…'       },
  { pct: 100, label: 'Bienvenue !'                  },
]

function BootScreen({ onComplete }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (step >= BOOT_STEPS.length) {
      const t = setTimeout(onComplete, 500)
      return () => clearTimeout(t)
    }
    const delay = step === 0 ? 600 : 400 + Math.random() * 200
    const t = setTimeout(() => setStep((s) => s + 1), delay)
    return () => clearTimeout(t)
  }, [step, onComplete])

  const current = BOOT_STEPS[Math.min(step, BOOT_STEPS.length - 1)]

  return (
    <div className="win95-boot">
      <div className="win95-boot-logo">
        <div className="win95-boot-flag">
          <div className="win95-boot-flag-r" />
          <div className="win95-boot-flag-g" />
          <div className="win95-boot-flag-b" />
          <div className="win95-boot-flag-y" />
        </div>
        <div className="win95-boot-win">Microsoft Windows</div>
        <div className="win95-boot-95">95</div>
        <div className="win95-boot-tagline">Copyright © Microsoft Corp. 1981–1995</div>
      </div>
      <div className="win95-boot-bar-track">
        <div className="win95-boot-bar-fill" style={{ width: `${current.pct}%` }} />
      </div>
      <div className="win95-boot-status">{current.label}</div>
    </div>
  )
}

export function OS() {
  const [booted,   setBooted]   = useState(false)
  const [showSafe, setShowSafe] = useState(false)

  const isShutdown       = useOSStore((s) => s.isShutdown)
  const numShutdowns     = useOSStore((s) => s.numShutdowns)
  const completeShutdown = useOSStore((s) => s.completeShutdown)
  const isBSOD           = useOSStore((s) => s.isBSOD)
  const triggerBSOD      = useOSStore((s) => s.triggerBSOD)
  const clearBSOD        = useOSStore((s) => s.clearBSOD)

  /* ── Startup sound on boot complete ─────────────────────────── */
  const handleBooted = useCallback(() => {
    setBooted(true)
    win95sounds.startup()
  }, [])

  /* ── BSOD recovery: clear flag + re-boot ────────────────────── */
  const handleBSODRecover = useCallback(() => {
    clearBSOD()
    setBooted(false)
  }, [clearBSOD])

  /* ── Shutdown → SafeToTurnOff → completeShutdown ───────────── */
  const handleShutdownComplete = useCallback(() => setShowSafe(true), [])
  const handleSafeDone = useCallback(() => {
    setShowSafe(false)
    completeShutdown()
  }, [completeShutdown])

  /* ── Random BSOD timer (2% every 30 s ≈ once per ~25 min) ──── */
  useEffect(() => {
    if (!booted || isShutdown || isBSOD) return
    const id = setInterval(() => {
      if (Math.random() < 0.02) triggerBSOD()
    }, 30000)
    return () => clearInterval(id)
  }, [booted, isShutdown, isBSOD, triggerBSOD])

  /* ── Glitch CRT aléatoire ────────────────────────────────────── */
  const crtRef = useRef(null)
  useEffect(() => {
    let tid
    const GLITCHES = [
      () => ({ transform: `translateX(${(Math.random() - 0.5) * 7}px)`, filter: 'none' }),
      () => ({ transform: 'none', filter: `hue-rotate(${Math.random() > 0.5 ? 10 : -10}deg) saturate(1.25)` }),
      () => ({ transform: `translateX(${(Math.random() - 0.5) * 4}px)`, filter: 'brightness(1.07)' }),
    ]
    const schedule = () => {
      tid = setTimeout(() => {
        const el = crtRef.current
        if (el) {
          const g = GLITCHES[Math.floor(Math.random() * GLITCHES.length)]()
          el.style.transform = g.transform
          el.style.filter    = g.filter
          setTimeout(() => { if (el) { el.style.transform = ''; el.style.filter = '' } }, 40 + Math.random() * 90)
        }
        schedule()
      }, 1800 + Math.random() * 5500)
    }
    schedule()
    return () => clearTimeout(tid)
  }, [])

  return (
    <div
      ref={crtRef}
      className="win95-crt-root"
      data-theme="retro-light"
      style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}
    >
      {/* Scanlines CRT */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 99999,
        background: 'repeating-linear-gradient(to bottom, transparent 0px, transparent 1px, rgba(0,0,0,0.06) 1px, rgba(0,0,0,0.06) 2px)',
      }} />

      {/* BSOD — overlay au-dessus de tout */}
      {isBSOD && <BSOD onRecover={handleBSODRecover} />}

      {/* SafeToTurnOff — overlay shutdown final */}
      {showSafe && <SafeToTurnOff onDone={handleSafeDone} />}

      <AnimatePresence mode="wait">
        {isShutdown && !showSafe ? (
          <motion.div key="shutdown" style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}>
            <ShutdownSequence numShutdowns={numShutdowns} onComplete={handleShutdownComplete} />
          </motion.div>
        ) : !booted && !isShutdown ? (
          <motion.div key="boot" style={{ position: 'absolute', inset: 0 }}
            exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <BootScreen onComplete={handleBooted} />
          </motion.div>
        ) : !isShutdown ? (
          <motion.div key="desktop" style={{ position: 'absolute', inset: 0 }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <Desktop />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

- Boot screen appears → finishes → startup.mp3 plays
- Desktop shows normally
- Menu Démarrer > Arrêter → ShutdownSequence runs → "Il est maintenant possible d'éteindre" appears on black screen for ~3.5 s → desktop reappears
- Wait 30 s+ and confirm BSOD does NOT appear immediately (low probability)

- [ ] **Step 3: Commit**

```bash
git add src/components/OS/OS.jsx
git commit -m "feat: wire BSOD timer, SafeToTurnOff, and startup sound into OS"
```

---

## Task 5: Right-click context menu

**Files:**
- Create: `src/components/OS/ContextMenu.jsx`
- Modify: `src/components/OS/Desktop.jsx`

- [ ] **Step 1: Create ContextMenu component**

```jsx
// src/components/OS/ContextMenu.jsx
import { useEffect, useRef, useState } from 'react'
import { win95sounds } from '../../utils/win95sounds'

/* Inline SystemProperties window content */
export function SystemProperties() {
  return (
    <div style={{ padding: '16px 20px', fontFamily: 'var(--w-font)', fontSize: 12 }}>
      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
        <span style={{ fontSize: 40 }}>🖥️</span>
        <div>
          <p style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>PonceletOS</p>
          <p>Microsoft Windows 95</p>
          <p>Version 4.00.950</p>
        </div>
      </div>
      <hr style={{ borderColor: '#808080', margin: '8px 0' }} />
      <p style={{ marginBottom: 6 }}><b>Ordinateur :</b></p>
      <p>Processeur : Intel Pentium 133 MHz</p>
      <p>Mémoire vive : 32,0 Mo de RAM</p>
      <hr style={{ borderColor: '#808080', margin: '8px 0' }} />
      <p><b>Propriétaire :</b> Tyméo Poncelet</p>
      <p><b>Organisation :</b> BTS SIO SISR</p>
    </div>
  )
}

export function ContextMenu({ x, y, containerRef, onClose, onOpenProperties }) {
  const menuRef   = useRef(null)
  const [subOpen, setSubOpen] = useState(false)

  /* Fermeture au clic extérieur */
  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  /* Ajuster la position pour rester dans le bureau */
  const MENU_W = 160, MENU_H = 120
  const container = containerRef?.current
  const bounds    = container ? container.getBoundingClientRect() : { width: 640, height: 452 }
  const adjX = x + MENU_W > bounds.width  ? x - MENU_W : x
  const adjY = y + MENU_H > bounds.height ? y - MENU_H : y

  return (
    <div
      ref={menuRef}
      className="win95-contextmenu"
      style={{ left: adjX, top: adjY }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="win95-contextmenu-item disabled">Actualiser</div>
      <div className="win95-contextmenu-divider" />
      <div
        className="win95-contextmenu-item has-submenu"
        onMouseEnter={() => setSubOpen(true)}
        onMouseLeave={() => setSubOpen(false)}
      >
        <span>Nouveau</span>
        <span style={{ marginLeft: 'auto', fontSize: 9 }}>▶</span>
        {subOpen && (
          <div className="win95-contextmenu win95-contextmenu-sub">
            <div className="win95-contextmenu-item disabled">Dossier</div>
            <div className="win95-contextmenu-item disabled">Raccourci</div>
          </div>
        )}
      </div>
      <div className="win95-contextmenu-divider" />
      <div
        className="win95-contextmenu-item"
        onMouseDown={() => { win95sounds.click(); onOpenProperties(); onClose() }}
      >
        Propriétés
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update Desktop.jsx**

Replace the full Desktop.jsx with the following (adds context menu state + Propriétés window):

```jsx
// src/components/OS/Desktop.jsx
import { useRef, useCallback, useState, useEffect } from 'react'
import { AnimatePresence }                          from 'framer-motion'
import { icons }                                    from '../../assets/icons/index.js'
import { useOSStore }                               from '../../stores/osStore'
import { Window }                                   from '../Window/Window'
import { Taskbar }                                  from './Taskbar'
import { ShowcaseExplorer }                         from './apps/ShowcaseExplorer'
import { ContextMenu, SystemProperties }            from './ContextMenu'

const SHOWCASE_WINDOW = {
  appId:   'showcase',
  title:   'Portfolio — Tyméo Poncelet',
  icon:    '🖥️',
  width:   780,
  height:  540,
  content: <ShowcaseExplorer />,
}

const PROPERTIES_WINDOW = {
  appId:  'properties',
  title:  'Propriétés système',
  icon:   '🖥️',
  width:  320,
  height: 280,
  content: <SystemProperties />,
}

export const ICONS = [
  {
    id:      'showcase',
    label:   'Portfolio',
    iconSrc: icons.showcaseIcon,
    pos:     { top: 6, left: 10 },
    window:  SHOWCASE_WINDOW,
  },
]

function DesktopShortcut({ entry, isSelected, onSelect, onOpen }) {
  const { iconSrc, label, pos } = entry
  const timerRef = useRef(null)

  const handleClick = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
      onOpen()
      return
    }
    onSelect()
    timerRef.current = setTimeout(() => { timerRef.current = null }, 300)
  }, [onSelect, onOpen])

  return (
    <button
      className={`win95-shortcut${isSelected ? ' selected' : ''}`}
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={handleClick}
      aria-label={`Ouvrir ${label}`}
    >
      <div className="win95-shortcut-icon-wrap">
        {isSelected && (
          <div
            className="win95-shortcut-overlay"
            style={{ WebkitMaskImage: `url(${iconSrc})` }}
          />
        )}
        <img src={iconSrc} alt={label} className="win95-shortcut-img" />
      </div>
      <span className="win95-shortcut-label">{label}</span>
    </button>
  )
}

export function Desktop() {
  const windows    = useOSStore((s) => s.windows)
  const openWindow = useOSStore((s) => s.openWindow)
  const [selected,     setSelected]     = useState(null)
  const [contextMenu,  setContextMenu]  = useState(null) // { x, y } | null
  const desktopRef = useRef(null)

  useEffect(() => { openWindow(SHOWCASE_WINDOW) }, []) // eslint-disable-line

  const contentRefs = useRef({})
  windows.forEach((w) => {
    if (!contentRefs.current[w.id]) {
      const icon = ICONS.find((i) => i.id === w.appId)
      contentRefs.current[w.id] = icon?.window.content ?? w.content ?? null
    }
  })
  const openIds = new Set(windows.map((w) => w.id))
  Object.keys(contentRefs.current).forEach((id) => {
    if (!openIds.has(Number(id))) delete contentRefs.current[id]
  })

  const handleOpen = useCallback((icon) => { openWindow(icon.window) }, [openWindow])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    if (e.target.closest('.win95-window')) return
    const rect = desktopRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
    setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  const openProperties = useCallback(() => {
    openWindow(PROPERTIES_WINDOW)
  }, [openWindow])

  return (
    <div
      ref={desktopRef}
      className="win95-desktop"
      onClick={() => setSelected(null)}
      onContextMenu={handleContextMenu}
    >
      {ICONS.map((icon) => (
        <DesktopShortcut
          key={icon.id}
          entry={icon}
          isSelected={selected === icon.id}
          onSelect={() => setSelected(icon.id)}
          onOpen={() => handleOpen(icon)}
        />
      ))}

      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.id} {...win}>
            {contentRefs.current[win.id]}
          </Window>
        ))}
      </AnimatePresence>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          containerRef={desktopRef}
          onClose={() => setContextMenu(null)}
          onOpenProperties={openProperties}
        />
      )}

      <Taskbar />
    </div>
  )
}
```

- [ ] **Step 3: Verify in browser**

Right-click on the teal desktop (not on a window) → Win95-style menu appears. Hover "Nouveau" → sub-menu shows. Click "Propriétés" → small system properties window opens with fake PC specs. Right-click anywhere closes the menu.

- [ ] **Step 4: Commit**

```bash
git add src/components/OS/ContextMenu.jsx src/components/OS/Desktop.jsx
git commit -m "feat: add right-click context menu with system properties"
```

---

## Task 6: Win95 cursors + context menu CSS

**Files:**
- Modify: `src/styles/win95.css`

- [ ] **Step 1: Append cursor and context menu styles at the end of win95.css**

Add the following block to the very end of `src/styles/win95.css`:

```css
/* ═══════════════════════════════════════════════════════════════
   WIN95 CURSORS — SVG data URIs, pixel-art style
   ═══════════════════════════════════════════════════════════════ */

/* Arrow (default) — hot spot 0 0 */
.win95-crt-root,
.win95-desktop,
.win95-window,
.win95-body {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='20'%3E%3Cpath fill='white' d='M0 0L0 14L3 11L6 17L8 16L5 10L9 10Z'/%3E%3Cpath fill='black' d='M0 0L0 13L3 10L6 16L7 15L4 9L8 9Z'/%3E%3C/svg%3E") 0 0, default;
}

/* Pointer (hand) — cliquables — hot spot 5 0 */
.win95-ctrl-btn,
.win95-tab-outer,
.win95-startmenu-item:not(.disabled),
.win95-contextmenu-item:not(.disabled),
.win95-shortcut,
button {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='20'%3E%3Cpath fill='white' stroke='white' stroke-width='1' d='M5 0L5 9L4 9L4 10L3 10L3 11L2 11L2 16L3 17L9 17L11 15L11 9L10 9L10 8L9 8L9 6L8 6L8 0Z'/%3E%3Cpath fill='black' d='M6 0L6 8L7 8L7 9L8 9L8 10L9 10L9 14L8 16L4 16L3 15L3 12L4 12L4 11L5 11L5 10L6 10L6 9Z'/%3E%3C/svg%3E") 5 0, pointer;
}

/* Wait (hourglass) — boot + BSOD recovery */
.win95-boot,
.blinking-cursor {
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='13' height='19'%3E%3Crect x='2' y='1' width='9' height='2' fill='black'/%3E%3Crect x='2' y='16' width='9' height='2' fill='black'/%3E%3Crect x='2' y='1' width='1' height='17' fill='black'/%3E%3Crect x='10' y='1' width='1' height='17' fill='black'/%3E%3Cpolygon points='3,3 10,3 6.5,9' fill='black'/%3E%3Cpolygon points='3,16 10,16 6.5,10' fill='black'/%3E%3C/svg%3E") 6 9, wait;
}

/* Move cursor on titlebar is handled inline in Window.jsx (cursor: move) */

/* ═══════════════════════════════════════════════════════════════
   CONTEXT MENU WIN95
   ═══════════════════════════════════════════════════════════════ */

.win95-contextmenu {
  position: absolute;
  background: var(--w-surface);
  box-shadow: var(--border-raised);
  font-family: var(--w-font);
  font-size: 11px;
  min-width: 150px;
  z-index: 99998;
  padding: 2px;
  user-select: none;
}

.win95-contextmenu-sub {
  position: absolute;
  left: 100%;
  top: -2px;
}

.win95-contextmenu-item {
  padding: 3px 24px 3px 8px;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='20'%3E%3Cpath fill='white' stroke='white' stroke-width='1' d='M5 0L5 9L4 9L4 10L3 10L3 11L2 11L2 16L3 17L9 17L11 15L11 9L10 9L10 8L9 8L9 6L8 6L8 0Z'/%3E%3Cpath fill='black' d='M6 0L6 8L7 8L7 9L8 9L8 10L9 10L9 14L8 16L4 16L3 15L3 12L4 12L4 11L5 11L5 10L6 10L6 9Z'/%3E%3C/svg%3E") 5 0, pointer;
}

.win95-contextmenu-item:not(.disabled):hover {
  background: var(--w-blue);
  color: #ffffff;
}

.win95-contextmenu-item.disabled {
  color: var(--w-shadow);
  cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='20'%3E%3Cpath fill='white' d='M0 0L0 14L3 11L6 17L8 16L5 10L9 10Z'/%3E%3Cpath fill='black' d='M0 0L0 13L3 10L6 16L7 15L4 9L8 9Z'/%3E%3C/svg%3E") 0 0, default;
}

.win95-contextmenu-item.has-submenu {
  position: relative;
}

.win95-contextmenu-divider {
  height: 1px;
  background: var(--w-shadow);
  margin: 2px 4px;
  box-shadow: 0 1px 0 var(--w-highlight);
}
```

- [ ] **Step 2: Verify cursors in browser**

- Move mouse over the teal desktop → custom pixelated arrow cursor
- Hover over Start button → hand/pointer cursor
- Hover over window body → arrow cursor
- During boot screen → hourglass cursor

- [ ] **Step 3: Commit**

```bash
git add src/styles/win95.css
git commit -m "feat: add Win95 pixel-art cursors and context menu CSS"
```

---

## Task 7: Wire sounds to Window and Taskbar

**Files:**
- Modify: `src/components/Window/Window.jsx`
- Modify: `src/components/OS/Taskbar.jsx`

- [ ] **Step 1: Add sounds to Window.jsx**

At the top of `src/components/Window/Window.jsx`, add the import:
```js
import { win95sounds } from '../../utils/win95sounds'
```

In the `Window` function, add a mount effect to play the open sound (after the existing useEffect for position):
```js
// Play open sound on mount
useEffect(() => { win95sounds.open() }, []) // eslint-disable-line
```

In the close `CtrlButton`'s onClick, add the sound before closing:
```jsx
onClick={(e) => { e.stopPropagation(); win95sounds.close(); closeWindow(id) }}
```

In the minimize `CtrlButton`'s onClick:
```jsx
onClick={(e) => { e.stopPropagation(); win95sounds.minimize(); minimizeWindow(id) }}
```

The maximize button stays silent (Win95 didn't have a distinct maximize sound).

- [ ] **Step 2: Add sounds to Taskbar.jsx**

At the top of `src/components/OS/Taskbar.jsx`, add:
```js
import { win95sounds } from '../../utils/win95sounds'
```

In `toggleStart`, add the click sound:
```js
const toggleStart = () => {
  win95sounds.click()
  lastClickInside.current = true
  setStartOpen((o) => !o)
}
```

In `handleStartItem`, play click on non-disabled items:
```js
const handleStartItem = (item) => {
  if (item.disabled || !item.id) return
  win95sounds.click()
  setStartOpen(false)
  lastClickInside.current = false
  if (item.id === 'shutdown') { triggerShutdown(); return }
  const icon = ICONS.find((i) => i.id === item.id)
  if (icon) openWindow(icon.window)
}
```

- [ ] **Step 3: Verify in browser**

- Open a window → soft ascending two-tone sound
- Click Start → click sound
- Click menu item → click sound
- Click close (×) → descending two-tone sound
- Click minimize → short descending sound

- [ ] **Step 4: Commit**

```bash
git add src/components/Window/Window.jsx src/components/OS/Taskbar.jsx
git commit -m "feat: wire Win95 sounds to window open/close/minimize and taskbar clicks"
```

---

## Done

All four Win95 features are now implemented:
- **A)** Startup chime + synthesized UI sounds on every interaction
- **B)** Random BSOD (2%/30s) with auto-recovery + "Safe to turn off" screen after shutdown
- **C)** Right-click context menu with sub-menu and system properties window
- **D)** Pixel-art Win95 cursors (arrow, pointer, hourglass) via SVG data URIs
