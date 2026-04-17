// src/components/OS/apps/ShowcaseExplorer.jsx
import { useState } from 'react'
import { BioNotepad }       from './BioNotepad'
import { ProjectsExplorer } from './ProjectsExplorer'
import { SkillsApp }        from './SkillsApp'
import { ContactApp }       from './ContactApp'

const NAV = [
  { id: 'home',     label: 'HOME'        },
  { id: 'bio',      label: 'BIOGRAPHIE'  },
  { id: 'projects', label: 'PROJETS'     },
  { id: 'skills',   label: 'COMPÉTENCES' },
  { id: 'contact',  label: 'CONTACT'     },
]

function getPanel(section) {
  switch (section) {
    case 'bio':      return <BioNotepad />
    case 'projects': return <ProjectsExplorer />
    case 'skills':   return <SkillsApp />
    case 'contact':  return <ContactApp />
    default:         return null
  }
}

export function ShowcaseExplorer() {
  const [section, setSection] = useState('home')

  if (section === 'home') {
    return (
      <div className="win95-showcase-home">
        <div className="win95-showcase-home-content">
          <h1 className="win95-showcase-home-title">Tyméo Poncelet</h1>
          <p className="win95-showcase-home-role">Student</p>
          <p className="win95-showcase-home-sub">BTS SIO SISR — Recherche stage</p>
          <nav className="win95-showcase-home-nav">
            {NAV.filter((n) => n.id !== 'home').map((n) => (
              <button
                key={n.id}
                className="win95-showcase-home-link"
                onClick={() => setSection(n.id)}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </div>
    )
  }

  return (
    <div className="win95-showcase">
      <div className="win95-showcase-sidebar">
        <div className="win95-showcase-sidebar-header">
          <p className="win95-showcase-sidebar-name">Tyméo<br />Poncelet</p>
          <p className="win95-showcase-sidebar-brand">Portfolio</p>
        </div>
        <nav className="win95-showcase-sidebar-nav">
          {NAV.map((n) => (
            <button
              key={n.id}
              className={`win95-showcase-nav-item${section === n.id ? ' active' : ''}`}
              onClick={() => setSection(n.id)}
            >
              {section === n.id ? '○ ' : ''}{n.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="win95-showcase-panel">
        {getPanel(section)}
      </div>
    </div>
  )
}
