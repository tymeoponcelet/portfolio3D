// src/components/OS/Desktop.jsx
import { useState }          from 'react'
import { useOSStore }         from '../../stores/osStore'
import { BioNotepad }         from './apps/BioNotepad'
import { ProjectsExplorer }   from './apps/ProjectsExplorer'
import { ContactApp }         from './apps/ContactApp'
import { SkillsApp }          from './apps/SkillsApp'

export const ICONS = [
  {
    id: 'bio',
    label: 'Biographie',
    icon: '📄',
    pos: [10, 6],
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
    id: 'projects',
    label: 'Mes Projets',
    icon: '📁',
    pos: [10, 100],
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
    id: 'skills',
    label: 'Compétences',
    icon: '⚙️',
    pos: [10, 194],
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
    id: 'contact',
    label: 'Contact',
    icon: '📬',
    pos: [10, 288],
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

export function Desktop() {
  const { openWindow } = useOSStore()
  const [selected, setSelected] = useState(null)

  return (
    <div
      className="win95-desktop"
      onClick={() => setSelected(null)}
    >
      {ICONS.map((icon) => (
        <div
          key={icon.id}
          className={`win95-icon${selected === icon.id ? ' selected' : ''}`}
          style={{ left: icon.pos[0], top: icon.pos[1] }}
          onClick={(e) => { e.stopPropagation(); setSelected(icon.id) }}
          onDoubleClick={(e) => { e.stopPropagation(); openWindow(icon.window) }}
        >
          <span className="win95-icon-img">{icon.icon}</span>
          <span className="win95-icon-label">{icon.label}</span>
        </div>
      ))}
    </div>
  )
}
