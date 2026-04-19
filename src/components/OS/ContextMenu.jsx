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
