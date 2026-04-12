// src/components/OS/Taskbar.jsx
import { useState, useEffect, useRef } from 'react'
import { useOSStore }     from '../../stores/osStore'
import { AnimatePresence, motion } from 'framer-motion'
import { ICONS }          from './Desktop'

function ShutdownDialog({ onClose }) {
  const [confirmed, setConfirmed] = useState(false)
  return (
    <div style={{ padding: 12, fontFamily: 'var(--w-font)', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {confirmed ? (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, marginBottom: 8 }}>💾</div>
          <div>Il est maintenant sans danger d'éteindre le portfolio.</div>
          <div style={{ color: '#555', marginTop: 4 }}>(Ce portfolio ne s'arrête jamais !)</div>
        </div>
      ) : (
        <>
          <div>Voulez-vous vraiment quitter Windows 95 ?</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="win95-btn" onClick={() => setConfirmed(true)}>Oui</button>
            <button className="win95-btn" onClick={onClose}>Non</button>
          </div>
        </>
      )}
    </div>
  )
}

function ShutdownDialogWrapper() {
  const { windows, closeWindow } = useOSStore()
  const win = windows.find((w) => w.appId === 'shutdown')
  const onClose = () => win && closeWindow(win.id)
  return <ShutdownDialog onClose={onClose} />
}

const START_ITEMS = [
  { label: 'Biographie',   icon: '📄', id: 'bio'      },
  { label: 'Mes Projets',  icon: '📁', id: 'projects' },
  { label: 'Compétences',  icon: '⚙️', id: 'skills'   },
  { label: 'Contact',      icon: '📬', id: 'contact'  },
  { divider: true },
  { label: 'Aide',         icon: '❓', id: null, disabled: true },
  { divider: true },
  { label: 'Arrêter…',     icon: '🔌', id: 'shutdown' },
]

export function Taskbar() {
  const { windows, minimizeWindow, focusWindow, openWindow } = useOSStore()
  const [startOpen, setStartOpen] = useState(false)
  const [clock,     setClock]     = useState('')
  const menuRef = useRef(null)
  const btnRef  = useRef(null)

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))
    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!startOpen) return
    const close = (e) => {
      if (!menuRef.current?.contains(e.target) && !btnRef.current?.contains(e.target))
        setStartOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [startOpen])

  const handleStartItem = (item) => {
    if (item.disabled || !item.id) return
    setStartOpen(false)

    if (item.id === 'shutdown') {
      openWindow({
        appId:   'shutdown',
        title:   '⚠️ Arrêt du système',
        icon:    '🔌',
        width:   300,
        height:  160,
        content: <ShutdownDialogWrapper />,
      })
      return
    }

    const icon = ICONS.find((i) => i.id === item.id)
    if (icon) openWindow(icon.window)
  }

  return (
    <>
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

      <div className="win95-taskbar">
        <button
          ref={btnRef}
          className={`win95-start-btn${startOpen ? ' open' : ''}`}
          onClick={() => setStartOpen((o) => !o)}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0 }}>
            <rect x="0" y="0" width="6" height="6" fill="#e74c3c" />
            <rect x="8" y="0" width="6" height="6" fill="#2ecc71" />
            <rect x="0" y="8" width="6" height="6" fill="#3498db" />
            <rect x="8" y="8" width="6" height="6" fill="#f1c40f" />
          </svg>
          Démarrer
        </button>

        <div className="win95-sep" />

        {windows.map((w) => (
          <button
            key={w.id}
            title={w.title}
            className={`win95-task-btn${!w.isMinimized ? ' active' : ''}`}
            onClick={() => {
              if (w.isMinimized) { minimizeWindow(w.id); focusWindow(w.id) }
              else minimizeWindow(w.id)
            }}
          >
            {w.icon && <span style={{ fontSize: 12 }}>{w.icon}</span>}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {w.title}
            </span>
          </button>
        ))}

        <div className="win95-tray">
          <span style={{ fontSize: 11, marginRight: 4 }}>🔊</span>
          <span className="win95-clock">{clock}</span>
        </div>
      </div>
    </>
  )
}
