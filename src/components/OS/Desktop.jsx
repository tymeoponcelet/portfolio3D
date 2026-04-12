// src/components/OS/Desktop.jsx
//
// Responsabilités :
//   - Fond teal Win95 + vignettage CRT (win95.css)
//   - Icônes bureau avec Lucide (filtre rétro .win95-icon-lucide)
//   - Rendu de toutes les fenêtres ouvertes (AnimatePresence + Window)
//   - Refs stables pour WindowBody.memo → zéro re-render pendant drag
//
// Architecture des contenus :
//   Les JSX elements (<BioNotepad />, etc.) sont créés UNE SEULE FOIS
//   à la racine du module (hors render). Résultat : la ref children
//   passée à WindowBody est toujours la même instance → WindowBody.memo
//   retourne false (pas de re-render) pendant les drag/resize. ✓

import { useRef, useCallback, useState } from 'react'
import { AnimatePresence, motion }       from 'framer-motion'
import { FileText, FolderOpen, Settings2, Mail } from 'lucide-react'
import { useOSStore }    from '../../stores/osStore'
import { Window }        from '../Window/Window'
import { Taskbar }       from './Taskbar'
import { BioNotepad }    from './apps/BioNotepad'
import { ProjectsExplorer } from './apps/ProjectsExplorer'
import { SkillsApp }     from './apps/SkillsApp'
import { ContactApp }    from './apps/ContactApp'
import { cn }            from '../../utils/cn'

/* ── Registre des icônes & fenêtres ─────────────────────────────── */
// Les contenus JSX sont créés ici une seule fois (scope module).
// Passer win.content comme children à <Window> donne une référence
// stable → WindowBody.memo ne re-rend JAMAIS pendant drag/resize.

export const ICONS = [
  {
    id:           'bio',
    label:        'Biographie',
    icon:         '📄',
    LucideIcon:   FileText,
    pos:          { top: 6,   left: 10 },
    window: {
      appId:   'bio',
      title:   'BIOGRAPHIE.TXT — Bloc-notes',
      icon:    '📄',
      width:   460,
      height:  380,
      content: <BioNotepad />,
    },
  },
  {
    id:           'projects',
    label:        'Mes Projets',
    icon:         '📁',
    LucideIcon:   FolderOpen,
    pos:          { top: 100, left: 10 },
    window: {
      appId:   'projects',
      title:   'C:\\Projets',
      icon:    '📁',
      width:   560,
      height:  380,
      content: <ProjectsExplorer />,
    },
  },
  {
    id:           'skills',
    label:        'Compétences',
    icon:         '⚙️',
    LucideIcon:   Settings2,
    pos:          { top: 194, left: 10 },
    window: {
      appId:   'skills',
      title:   'Compétences — Panneau de configuration',
      icon:    '⚙️',
      width:   380,
      height:  360,
      content: <SkillsApp />,
    },
  },
  {
    id:           'contact',
    label:        'Contact',
    icon:         '📬',
    LucideIcon:   Mail,
    pos:          { top: 288, left: 10 },
    window: {
      appId:   'contact',
      title:   "Contact — Carnet d'adresses",
      icon:    '📬',
      width:   340,
      height:  260,
      content: <ContactApp />,
    },
  },
]

/* ── DesktopIcon ─────────────────────────────────────────────────── */
// Icône de bureau avec Lucide + filtre rétro bitmap Win95.
// Sélection sur click, ouverture sur double-click (comportement Win95).

function DesktopIcon({ entry, isSelected, onSelect, onOpen }) {
  const { LucideIcon, label, pos } = entry

  return (
    <button
      className={cn('win95-icon', isSelected && 'selected')}
      style={{ position: 'absolute', top: pos.top, left: pos.left }}
      onClick={(e)      => { e.stopPropagation(); onSelect() }}
      onDoubleClick={(e) => { e.stopPropagation(); onOpen()  }}
      aria-label={`Ouvrir ${label}`}
    >
      <span className="win95-icon-img">
        <LucideIcon
          size={32}
          strokeWidth={1.5}
          className="win95-icon-lucide"
        />
      </span>
      <span className="win95-icon-label">{label}</span>
    </button>
  )
}

/* ── Desktop ─────────────────────────────────────────────────────── */

export function Desktop() {
  const windows    = useOSStore((s) => s.windows)
  const openWindow = useOSStore((s) => s.openWindow)
  const [selected, setSelected] = useState(null)

  /* Refs stables pour les contenus de fenêtres (memoïsation WindowBody) */
  const contentRefs = useRef({})
  windows.forEach((w) => {
    if (!contentRefs.current[w.id]) {
      // Chercher le content de l'icône correspondante
      const icon = ICONS.find((i) => i.id === w.appId)
      contentRefs.current[w.id] = icon?.window.content ?? w.content ?? null
    }
  })
  // Nettoyage des fenêtres fermées
  const openIds = new Set(windows.map((w) => w.id))
  Object.keys(contentRefs.current).forEach((id) => {
    if (!openIds.has(Number(id))) delete contentRefs.current[id]
  })

  const handleOpen = useCallback((icon) => {
    openWindow(icon.window)
  }, [openWindow])

  return (
    <div
      className="win95-desktop"
      onClick={() => setSelected(null)}
    >

      {/* Icônes bureau */}
      {ICONS.map((icon) => (
        <DesktopIcon
          key={icon.id}
          entry={icon}
          isSelected={selected === icon.id}
          onSelect={() => setSelected(icon.id)}
          onOpen={() => handleOpen(icon)}
        />
      ))}

      {/* Fenêtres ouvertes — AnimatePresence gère les entrées/sorties */}
      <AnimatePresence>
        {windows.map((win) => (
          <Window key={win.id} {...win}>
            {contentRefs.current[win.id]}
          </Window>
        ))}
      </AnimatePresence>

      {/* Barre des tâches */}
      <Taskbar />

    </div>
  )
}
