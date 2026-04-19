// src/components/OS/Taskbar.jsx
// Taskbar style Henry Heffernan (Toolbar.tsx)
//   • Bouton Démarrer : windowsStartIcon.png + texte
//   • Menu Démarrer : sidebar "PonceletOS" + items
//   • Tabs fenêtres : icône emoji + nom tronqué, état actif = checkerboard
//   • Tray : volumeOn.png + heure AM/PM

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion }                  from 'framer-motion'
import { useOSStore }                               from '../../stores/osStore'
import { icons }                                    from '../../assets/icons/index.js'
import { ICONS }                                    from './Desktop'
import { win95sounds } from '../../utils/win95sounds'

/* ── Éléments du menu Démarrer ─────────────────────────────────── */

const START_ITEMS = [
  { label: 'Portfolio', icon: '🖥️', id: 'showcase' },
  { divider: true },
  { label: 'Aide',      icon: '❓', id: null, disabled: true },
  { divider: true },
  { label: 'Arrêter…', icon: '🔌', id: 'shutdown' },
]

/* ── Utilitaire heure AM/PM ────────────────────────────────────── */

function getTime() {
  const d    = new Date()
  let h      = d.getHours()
  const m    = d.getMinutes()
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m < 10 ? '0' + m : m} ${ampm}`
}

/* ── Taskbar ─────────────────────────────────────────────────────── */

export function Taskbar() {
  const { windows, minimizeWindow, focusWindow, openWindow, triggerShutdown } = useOSStore()
  const [startOpen, setStartOpen] = useState(false)
  const [time,      setTime]      = useState(getTime)
  const menuRef = useRef(null)
  const btnRef  = useRef(null)
  const lastClickInside = useRef(false)

  /* Heure — mise à jour toutes les 5s */
  useEffect(() => {
    setTime(getTime())
    const id = setInterval(() => setTime(getTime()), 5000)
    return () => clearInterval(id)
  }, [])

  /* Fermeture menu Démarrer au clic extérieur */
  const onGlobalClick = useCallback(() => {
    if (lastClickInside.current) { lastClickInside.current = false; return }
    setStartOpen(false)
  }, [])

  useEffect(() => {
    window.addEventListener('mousedown', onGlobalClick)
    return () => window.removeEventListener('mousedown', onGlobalClick)
  }, [onGlobalClick])

  const toggleStart = () => {
    win95sounds.click()
    lastClickInside.current = true
    setStartOpen((o) => !o)
  }

  const handleStartItem = (item) => {
    if (item.disabled || !item.id) return
    win95sounds.click()
    setStartOpen(false)
    lastClickInside.current = false
    if (item.id === 'shutdown') { triggerShutdown(); return }
    const icon = ICONS.find((i) => i.id === item.id)
    if (icon) openWindow(icon.window)
  }

  /* Fenêtre active = plus haut zIndex */
  const maxZ     = windows.reduce((m, w) => Math.max(m, w.zIndex), 0)
  const activeId = windows.find((w) => w.zIndex === maxZ)?.id ?? null

  return (
    <>
      {/* ── Menu Démarrer ── */}
      <AnimatePresence>
        {startOpen && (
          <motion.div
            ref={menuRef}
            className="win95-startmenu"
            style={{ originY: 1 }}
            initial={{ scaleY: 0, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0, opacity: 0 }}
            transition={{ duration: 0.1 }}
            onMouseDown={() => { lastClickInside.current = true }}
          >
            <div className="win95-startmenu-sidebar">
              <span>PonceletOS</span>
            </div>
            <div className="win95-startmenu-items">
              {START_ITEMS.map((item, i) =>
                item.divider ? (
                  <div key={i} className="win95-startmenu-divider" />
                ) : (
                  <div
                    key={item.label}
                    className={`win95-startmenu-item${item.disabled ? ' disabled' : ''}`}
                    onMouseDown={() => handleStartItem(item)}
                  >
                    <span style={{ fontSize: 16, width: 22, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Barre des tâches ── */}
      <div className="win95-taskbar">

        {/* Bouton Démarrer */}
        <div
          className={`win95-tab-outer${startOpen ? ' win95-tab-active' : ''}`}
          onMouseDown={toggleStart}
          ref={btnRef}
          style={{ marginLeft: 3, cursor: 'pointer', flexShrink: 0 }}
        >
          <div className={`win95-tab-inner${startOpen ? ' win95-tab-inner-active' : ''}`}>
            <img
              src={icons.windowsStartIcon}
              alt="Start"
              style={{ width: 18, height: 18, imageRendering: 'pixelated', marginRight: 4, flexShrink: 0 }}
            />
            <p className="win95-toolbar-text" style={{ fontWeight: 'bold' }}>Démarrer</p>
          </div>
        </div>

        <div className="win95-sep" />

        {/* Tabs fenêtres */}
        <div style={{ flex: 1, display: 'flex', gap: 4, overflow: 'hidden' }}>
          {windows.map((w) => {
            const isActive = w.id === activeId && !w.isMinimized
            return (
              <div
                key={w.id}
                className={`win95-tab-outer${isActive ? ' win95-tab-active' : ''}`}
                style={{ maxWidth: 200, cursor: 'pointer', overflow: 'hidden' }}
                onMouseDown={() => {
                  if (w.isMinimized) { minimizeWindow(w.id); focusWindow(w.id) }
                  else if (isActive) minimizeWindow(w.id)
                  else focusWindow(w.id)
                }}
              >
                <div className={`win95-tab-inner${isActive ? ' win95-tab-inner-active' : ''}`}>
                  {w.icon && <span style={{ fontSize: 12, flexShrink: 0, marginRight: 4 }}>{w.icon}</span>}
                  <span style={{
                    fontFamily: 'var(--w-font)', fontSize: 11,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {w.title}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tray */}
        <div className="win95-tray">
          <img
            src={icons.volumeOn}
            alt="volume"
            style={{ width: 18, height: 18, imageRendering: 'pixelated', cursor: 'pointer', marginRight: 4 }}
          />
          <span className="win95-clock">{time}</span>
        </div>
      </div>
    </>
  )
}
