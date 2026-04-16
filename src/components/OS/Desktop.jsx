// src/components/OS/Desktop.jsx
//
// DesktopShortcut — pattern Henry Heffernan :
//   • 1 clic  → sélection (fond checkerboard bleu masqué sur l'icône PNG)
//   • 2 clics → ouverture de la fenêtre
//   • clic extérieur → désélection
//
// Icônes PNG importées via src/assets/icons/index.js

import { useRef, useCallback, useState } from 'react'
import { AnimatePresence }               from 'framer-motion'
import { icons }                         from '../../assets/icons/index.js'
import { useOSStore }                    from '../../stores/osStore'
import { Window }                        from '../Window/Window'
import { Taskbar }                       from './Taskbar'
import { BioNotepad }                    from './apps/BioNotepad'
import { ProjectsExplorer }              from './apps/ProjectsExplorer'
import { SkillsApp }                     from './apps/SkillsApp'
import { ContactApp }                    from './apps/ContactApp'

/* ── Registre des icônes & fenêtres ─────────────────────────────── */

export const ICONS = [
  {
    id:       'bio',
    label:    'Biographie',
    iconSrc:  icons.showcaseIcon,
    pos:      { top: 6, left: 10 },
    window: {
      appId:   'bio',
      title:   'BIOGRAPHIE.TXT — Bloc-notes',
      icon:    '📄',
      width:   480,
      height:  400,
      content: <BioNotepad />,
    },
  },
  {
    id:       'projects',
    label:    'Mes Projets',
    iconSrc:  icons.windowExplorerIcon,
    pos:      { top: 110, left: 10 },
    window: {
      appId:   'projects',
      title:   'C:\\Projets',
      icon:    '📁',
      width:   580,
      height:  400,
      content: <ProjectsExplorer />,
    },
  },
  {
    id:       'skills',
    label:    'Compétences',
    iconSrc:  icons.computerBig,
    pos:      { top: 214, left: 10 },
    window: {
      appId:   'skills',
      title:   'Compétences — Panneau de configuration',
      icon:    '⚙️',
      width:   400,
      height:  380,
      content: <SkillsApp />,
    },
  },
  {
    id:       'contact',
    label:    'Contact',
    iconSrc:  icons.credits,
    pos:      { top: 318, left: 10 },
    window: {
      appId:   'contact',
      title:   "Contact — Carnet d'adresses",
      icon:    '📬',
      width:   360,
      height:  280,
      content: <ContactApp />,
    },
  },
]

/* ── DesktopShortcut ─────────────────────────────────────────────── */

function DesktopShortcut({ entry, isSelected, onSelect, onOpen }) {
  const { iconSrc, label, pos } = entry
  const timerRef = useRef(null)

  const handleClick = useCallback(() => {
    if (timerRef.current) {
      // Double-clic détecté
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
        {/* Overlay checkerboard masqué sur la forme de l'icône */}
        {isSelected && (
          <div
            className="win95-shortcut-overlay"
            style={{ WebkitMaskImage: `url(${iconSrc})` }}
          />
        )}
        <img
          src={iconSrc}
          alt={label}
          className="win95-shortcut-img"
        />
      </div>
      <span className="win95-shortcut-label">{label}</span>
    </button>
  )
}

/* ── Desktop ─────────────────────────────────────────────────────── */

export function Desktop() {
  const windows    = useOSStore((s) => s.windows)
  const openWindow = useOSStore((s) => s.openWindow)
  const [selected, setSelected] = useState(null)

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
