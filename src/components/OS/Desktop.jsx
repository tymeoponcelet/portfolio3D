// src/components/OS/Desktop.jsx
import { useRef, useCallback, useState, useEffect } from 'react'
import { AnimatePresence }                          from 'framer-motion'
import { icons }                                    from '../../assets/icons/index.js'
import { useOSStore }                               from '../../stores/osStore'
import { Window }                                   from '../Window/Window'
import { Taskbar }                                  from './Taskbar'
import { ShowcaseExplorer }                         from './apps/ShowcaseExplorer'

/* ── Registre de la fenêtre Showcase ─────────────────────────── */

const SHOWCASE_WINDOW = {
  appId:   'showcase',
  title:   'Portfolio — Tyméo Poncelet',
  icon:    '🖥️',
  width:   640,
  height:  480,
  content: <ShowcaseExplorer />,
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

/* ── DesktopShortcut ─────────────────────────────────────────── */

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

/* ── Desktop ─────────────────────────────────────────────────── */

export function Desktop() {
  const windows    = useOSStore((s) => s.windows)
  const openWindow = useOSStore((s) => s.openWindow)
  const [selected, setSelected] = useState(null)

  /* Auto-ouverture du ShowcaseExplorer au boot */
  useEffect(() => {
    openWindow(SHOWCASE_WINDOW)
  }, []) // eslint-disable-line

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

  return (
    <div className="win95-desktop" onClick={() => setSelected(null)}>

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

      <Taskbar />
    </div>
  )
}
