// src/components/OS/apps/ShowcaseExplorer.jsx
import { useState } from 'react'
import { BioNotepad }       from './BioNotepad'
import { SkillsApp }        from './SkillsApp'
import { ProjectsExplorer } from './ProjectsExplorer'
import { ContactApp }       from './ContactApp'

const NAV = [
  { id: 'home',       label: 'HOME'       },
  { id: 'about',      label: 'ABOUT'      },
  { id: 'experience', label: 'EXPERIENCE' },
  { id: 'projects',   label: 'PROJECTS'   },
  { id: 'contact',    label: 'CONTACT'    },
]

function VerticalNavbar({ section, setSection }) {
  return (
    <div className="showcase-navbar">
      <div className="showcase-navbar-header">
        <p className="showcase-navbar-name">Tyméo<br />Poncelet</p>
        <p className="showcase-navbar-sub">Portfolio '26</p>
      </div>
      <div className="showcase-navbar-links">
        {NAV.map((n) => (
          <button
            key={n.id}
            className={`showcase-nav-link${section === n.id ? ' active' : ''}`}
            onClick={() => setSection(n.id)}
          >
            {n.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function ShowcaseExplorer() {
  const [section, setSection] = useState('home')
  const isHome = section === 'home'

  return (
    <div className="site-page">
      {!isHome && <VerticalNavbar section={section} setSection={setSection} />}

      {isHome ? (
        <div className="site-page-home">
          <div className="site-page-home-content">
            <h1 className="site-page-home-title">Tyméo Poncelet</h1>
            <h2 className="site-page-home-role">Étudiant BTS SIO SISR</h2>
            <p className="site-page-home-sub">Pôle Sup DE LA SALLE — Recherche stage</p>
            <div className="site-page-home-nav">
              {NAV.filter((n) => n.id !== 'home').map((n) => (
                <button
                  key={n.id}
                  className="showcase-nav-link"
                  onClick={() => setSection(n.id)}
                >
                  {n.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {section === 'about'      && <BioNotepad />}
          {section === 'experience' && <SkillsApp />}
          {section === 'projects'   && <ProjectsExplorer />}
          {section === 'contact'    && <ContactApp />}
        </>
      )}
    </div>
  )
}
