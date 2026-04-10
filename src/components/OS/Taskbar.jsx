import { useState, useEffect, useRef } from 'react'
import { useWindowStore } from '../../stores/windowStore'
import { AnimatePresence, motion } from 'framer-motion'
import { ICONS } from './Desktop'

// Éléments du menu Démarrer
const START_ITEMS = [
  { label: 'À propos',      icon: '💻', id: 'about' },
  { label: 'Mes Projets',   icon: '📁', id: 'projects' },
  { label: 'Compétences',   icon: '📄', id: 'skills' },
  { label: 'Contact',       icon: '📬', id: 'contact' },
  { divider: true },
  { label: 'Aide',          icon: '❓', id: null, disabled: true },
  { label: 'Exécuter…',     icon: '🚀', id: null, disabled: true },
  { divider: true },
  { label: 'Arrêter…',      icon: '🔌', id: 'shutdown' },
]

export function Taskbar() {
  const { windows, minimizeWindow, focusWindow, openWindow } = useWindowStore()
  const [startOpen, setStartOpen] = useState(false)
  const [clock, setClock] = useState('')
  const menuRef = useRef(null)
  const btnRef  = useRef(null)

  // Horloge — mise à jour chaque minute
  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  // Fermer le menu en cliquant en dehors
  useEffect(() => {
    if (!startOpen) return
    const close = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target)) {
        setStartOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [startOpen])

  const handleStartItem = (item) => {
    if (item.disabled || !item.id) return
    setStartOpen(false)

    if (item.id === 'shutdown') {
      // Easter egg : dialog fermeture
      const existing = windows.find((w) => w.title === '⚠️ Arrêt du système')
      if (!existing) {
        openWindow({
          title: '⚠️ Arrêt du système',
          icon: '🔌',
          width: 280,
          height: 150,
          content: (
            <div style={{ padding: 12, fontFamily: 'MS Sans Serif, Arial', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>Vous êtes sur le point d'arrêter le portfolio.</div>
              <div>Voulez-vous vraiment quitter Windows 95 ?</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 4 }}>
                <button className="win95-btn" onClick={() => alert('Non ! Le portfolio continue !')}>Oui</button>
                <button className="win95-btn">Non</button>
              </div>
            </div>
          ),
        })
      }
      return
    }

    const icon = ICONS.find((i) => i.id === item.id)
    if (!icon) return

    const existing = windows.find((w) => w.title === icon.window.title)
    if (existing) {
      if (existing.isMinimized) minimizeWindow(existing.id)
      focusWindow(existing.id)
      return
    }
    openWindow({ ...icon.window, content: icon.window.content() })
  }

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
          >
            <div className="win95-startmenu-sidebar">
              <span>Windows 95</span>
            </div>
            <div className="win95-startmenu-items">
              {START_ITEMS.map((item, i) =>
                item.divider ? (
                  <div key={i} className="win95-startmenu-divider" />
                ) : (
                  <div
                    key={item.label}
                    className={`win95-startmenu-item${item.disabled ? ' disabled' : ''}`}
                    onClick={() => handleStartItem(item)}
                  >
                    <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
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
        <button
          ref={btnRef}
          className={`win95-start-btn${startOpen ? ' open' : ''}`}
          onClick={() => setStartOpen((o) => !o)}
        >
          {/* Mini drapeau Windows 4 couleurs */}
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
            <rect x="0" y="0" width="6" height="6" fill="#e74c3c" />
            <rect x="8" y="0" width="6" height="6" fill="#2ecc71" />
            <rect x="0" y="8" width="6" height="6" fill="#3498db" />
            <rect x="8" y="8" width="6" height="6" fill="#f1c40f" />
          </svg>
          Démarrer
        </button>

        <div className="win95-sep" />

        {/* Bouton par fenêtre ouverte */}
        {windows.map((w) => (
          <button
            key={w.id}
            title={w.title}
            className={`win95-task-btn${!w.isMinimized ? ' active' : ''}`}
            onClick={() => {
              if (w.isMinimized) {
                minimizeWindow(w.id)
                focusWindow(w.id)
              } else {
                minimizeWindow(w.id)
              }
            }}
          >
            {w.icon && <span style={{ fontSize: 12 }}>{w.icon}</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {w.title}
            </span>
          </button>
        ))}

        {/* Zone de notification + horloge */}
        <div className="win95-tray">
          <span style={{ fontSize: 11, marginRight: 4 }}>🔊</span>
          <span className="win95-clock">{clock}</span>
        </div>
      </div>
    </>
  )
}
