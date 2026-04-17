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

export function ShowcaseExplorer() {
  const [section, setSection] = useState('home')
  const isHome = section === 'home'

  return (
    <>
      {/* HOME splash — always mounted, hidden when section is not home */}
      <div className="win95-showcase-home" style={{ display: isHome ? undefined : 'none' }}>
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

      {/* Sidebar layout — always mounted, hidden when on HOME */}
      <div className="win95-showcase" style={{ display: isHome ? 'none' : undefined }}>
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
                {n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="win95-showcase-panel">
          {/* All panels always mounted — display:contents passes layout to parent flex,
              display:none hides without unmounting (preserves child state) */}
          <div style={{ display: section === 'bio'      ? 'contents' : 'none' }}><BioNotepad /></div>
          <div style={{ display: section === 'projects' ? 'contents' : 'none' }}><ProjectsExplorer /></div>
          <div style={{ display: section === 'skills'   ? 'contents' : 'none' }}><SkillsApp /></div>
          <div style={{ display: section === 'contact'  ? 'contents' : 'none' }}><ContactApp /></div>
        </div>
      </div>
    </>
  )
}
