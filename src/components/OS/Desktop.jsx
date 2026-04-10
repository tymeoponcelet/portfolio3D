import { useState } from 'react'
import { useWindowStore } from '../../stores/windowStore'

// ══════════════════════════════════════════════════════════════════
//  CONTENU DES PROGRAMMES
// ══════════════════════════════════════════════════════════════════

// ── À propos / Système ──
function AboutContent() {
  return (
    <div className="win95-about">
      <div className="win95-about-header">
        <div className="win95-about-icon">💻</div>
        <div>
          <div className="win95-about-title">Portfolio — Windows 95</div>
          <div className="win95-about-sub">Version 1.0 · Build 950</div>
        </div>
      </div>
      <div className="win95-about-field">
        <span className="win95-about-key">Développeur :</span>
        <span className="win95-about-val">Votre Nom</span>
      </div>
      <div className="win95-about-field">
        <span className="win95-about-key">Poste :</span>
        <span className="win95-about-val">Développeur Full Stack</span>
      </div>
      <div className="win95-about-field">
        <span className="win95-about-key">Technologies :</span>
        <span className="win95-about-val">React · Three.js · Node.js</span>
      </div>
      <div className="win95-about-field">
        <span className="win95-about-key">Localisation :</span>
        <span className="win95-about-val">Paris, France</span>
      </div>
      <div className="win95-about-field">
        <span className="win95-about-key">Disponibilité :</span>
        <span className="win95-about-val" style={{ color: 'green', fontWeight: 'bold' }}>Ouvert aux opportunités ✓</span>
      </div>
      <hr className="win95-hr" />
      <div style={{ fontSize: 10, color: '#555' }}>
        Ce portfolio a été conçu et développé avec React, Three.js (@react-three/fiber) et le
        design system authentique de Windows 95. Chaque fenêtre est draggable, redimensionnable
        et se minimise dans la barre des tâches.
      </div>
    </div>
  )
}

// ── Explorateur de projets ──
function ProjectsContent() {
  const [selected, setSelected] = useState(null)

  const files = [
    { name: 'Portfolio_3D',       ext: 'exe', icon: '💻', size: '2 048 Ko', desc: 'React · Three.js · R3F · CSS3D' },
    { name: 'E-Commerce_App',     ext: 'exe', icon: '🛒', size: '4 096 Ko', desc: 'Next.js · Stripe · PostgreSQL' },
    { name: 'REST_API_Server',    ext: 'dll', icon: '⚙️', size: '1 024 Ko', desc: 'Node.js · Express · JWT' },
    { name: 'Dashboard_Analytics',ext: 'exe', icon: '📊', size: '3 072 Ko', desc: 'React · D3.js · WebSocket' },
    { name: 'Mobile_App',         ext: 'apk', icon: '📱', size: '8 192 Ko', desc: 'React Native · Expo' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="win95-explorer" style={{ flex: 1, overflow: 'auto' }}>
        {files.map((f) => (
          <div
            key={f.name}
            className={`win95-file-row${selected === f.name ? ' selected' : ''}`}
            onClick={() => setSelected(f.name)}
            onDoubleClick={() => alert(`${f.name}.${f.ext}\n\n${f.desc}`)}
          >
            <span className="win95-file-icon">{f.icon}</span>
            <span className="win95-file-name">{f.name}.{f.ext}</span>
            <span className="win95-file-size">{f.size}</span>
          </div>
        ))}
      </div>
      <div className="win95-statusbar">
        <span className="win95-statusbar-field">{files.length} objet(s)</span>
        <span className="win95-statusbar-field">
          {selected ? `${selected} sélectionné` : 'Aucune sélection'}
        </span>
      </div>
    </div>
  )
}

// ── Compétences (Notepad) ──
const SKILLS_TXT = `COMPETENCES.TXT — Dernière modification : 10/04/2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FRONT-END
  ✓ React / Next.js      ████████████ Expert
  ✓ TypeScript           ██████████░░ Avancé
  ✓ Three.js / WebGL     █████████░░░ Avancé
  ✓ CSS / Tailwind       ████████████ Expert
  ✓ Framer Motion        ████████░░░░ Intermédiaire

BACK-END
  ✓ Node.js / Express    ████████████ Expert
  ✓ PostgreSQL           ██████████░░ Avancé
  ✓ MongoDB              ████████░░░░ Intermédiaire
  ✓ REST / GraphQL API   ████████████ Expert

OUTILS
  ✓ Git / GitHub         ████████████ Expert
  ✓ Docker               ████████░░░░ Intermédiaire
  ✓ Figma / Design       ███████░░░░░ Intermédiaire
  ✓ Linux / Bash         ████████░░░░ Avancé

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
C:\\PORTFOLIO> _`

function SkillsContent() {
  return (
    <textarea
      className="win95-notepad"
      defaultValue={SKILLS_TXT}
      spellCheck={false}
      readOnly
    />
  )
}

// ── Contact ──
function ContactContent() {
  const fields = [
    { icon: '📧', label: 'E-mail',    value: 'contact@example.com' },
    { icon: '💼', label: 'LinkedIn',  value: 'linkedin.com/in/monprofil' },
    { icon: '🐙', label: 'GitHub',    value: 'github.com/monusername' },
    { icon: '🐦', label: 'Twitter',   value: '@montwitter' },
    { icon: '🌐', label: 'Site Web',  value: 'monportfolio.fr' },
  ]

  return (
    <div className="win95-about">
      <div className="win95-about-header">
        <div className="win95-about-icon">📬</div>
        <div>
          <div className="win95-about-title">Carnet d'adresses</div>
          <div className="win95-about-sub">Votre Nom — Développeur</div>
        </div>
      </div>
      {fields.map((f) => (
        <div key={f.label} className="win95-about-field">
          <span style={{ fontSize: 14, width: 18, flexShrink: 0 }}>{f.icon}</span>
          <span className="win95-about-key">{f.label} :</span>
          <span className="win95-about-val" style={{ color: '#000080', textDecoration: 'underline', cursor: 'pointer' }}>
            {f.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Poste de travail (My Computer) ──
function MyComputerContent() {
  const drives = [
    { icon: '💽', name: 'Disque 3½ (A:)', free: '—' },
    { icon: '💿', name: 'Disque local (C:)',  free: '420 Mo libre' },
    { icon: '📀', name: 'CD-ROM (D:)',        free: 'Vide' },
    { icon: '🖨️',  name: 'Imprimante',        free: 'HP LaserJet' },
    { icon: '🖥️',  name: 'Panneau de configuration', free: '' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="win95-explorer" style={{ flex: 1 }}>
        {drives.map((d) => (
          <div key={d.name} className="win95-file-row">
            <span className="win95-file-icon">{d.icon}</span>
            <span className="win95-file-name">{d.name}</span>
            <span className="win95-file-size" style={{ fontSize: 10, color: '#555' }}>{d.free}</span>
          </div>
        ))}
      </div>
      <div className="win95-statusbar">
        <span className="win95-statusbar-field">{drives.length} objet(s)</span>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
//  ICÔNES DU BUREAU (exportées pour la Taskbar)
// ══════════════════════════════════════════════════════════════════

export const ICONS = [
  {
    id: 'mycomputer',
    label: 'Poste de travail',
    icon: '🖥️',
    pos: [10, 6],
    window: {
      title: 'Poste de travail',
      icon: '🖥️',
      width: 360,
      height: 280,
      content: () => <MyComputerContent />,
    },
  },
  {
    id: 'about',
    label: 'À propos',
    icon: '💻',
    pos: [10, 96],
    window: {
      title: 'À propos — Portfolio',
      icon: '💻',
      width: 380,
      height: 320,
      content: () => <AboutContent />,
    },
  },
  {
    id: 'projects',
    label: 'Mes Projets',
    icon: '📁',
    pos: [10, 186],
    window: {
      title: 'C:\\Projets',
      icon: '📁',
      width: 440,
      height: 300,
      content: () => <ProjectsContent />,
    },
  },
  {
    id: 'skills',
    label: 'Compétences',
    icon: '📄',
    pos: [10, 276],
    window: {
      title: 'COMPETENCES.TXT — Bloc-notes',
      icon: '📄',
      width: 380,
      height: 340,
      content: () => <SkillsContent />,
    },
  },
  {
    id: 'contact',
    label: 'Contact',
    icon: '📬',
    pos: [10, 366],
    window: {
      title: 'Contact',
      icon: '📬',
      width: 340,
      height: 280,
      content: () => <ContactContent />,
    },
  },
]

// ══════════════════════════════════════════════════════════════════
//  COMPOSANT DESKTOP
// ══════════════════════════════════════════════════════════════════

export function Desktop() {
  const { openWindow, windows } = useWindowStore()
  const [selected, setSelected] = useState(null)

  const handleOpen = (icon) => {
    const alreadyOpen = windows.find((w) => w.title === icon.window.title)
    if (alreadyOpen) return
    openWindow({ ...icon.window, content: icon.window.content() })
  }

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
          onDoubleClick={(e) => { e.stopPropagation(); handleOpen(icon) }}
        >
          <span className="win95-icon-img">{icon.icon}</span>
          <span className="win95-icon-label">{icon.label}</span>
        </div>
      ))}
    </div>
  )
}
