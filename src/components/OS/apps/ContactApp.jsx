// src/components/OS/apps/ContactApp.jsx
import { useState } from 'react'

const CONTACTS = [
  {
    id:    'email',
    icon:  '📧',
    label: 'E-mail',
    path:  "C:\\Carnet d'adresses\\E-mail",
    value: 'tymeo.poncelet@gmail.com',
    href:  'mailto:tymeo.poncelet@gmail.com',
    desc:  'Adresse de messagerie principale.',
  },
  {
    id:    'tel',
    icon:  '📱',
    label: 'Téléphone',
    path:  "C:\\Carnet d'adresses\\Téléphone",
    value: '06 10 25 32 34',
    href:  'tel:+33610253234',
    desc:  'Disponible en semaine.',
  },
  {
    id:    'linkedin',
    icon:  '💼',
    label: 'LinkedIn',
    path:  "C:\\Carnet d'adresses\\LinkedIn",
    value: 'linkedin.com/in/tyméo-poncelet-83b667383',
    href:  'https://www.linkedin.com/in/tyméo-poncelet-83b667383',
    desc:  'Profil professionnel.',
  },
  {
    id:    'github',
    icon:  '🐙',
    label: 'GitHub',
    path:  "C:\\Carnet d'adresses\\GitHub",
    value: 'github.com/tymeoponcelet',
    href:  'https://github.com/tymeoponcelet',
    desc:  'Dépôts et projets personnels.',
  },
]

export function ContactApp() {
  const [active, setActive] = useState(CONTACTS[0])

  return (
    <div className="win95-explorer">

      {/* Barre d'adresse */}
      <div className="win95-explorer-addr">
        <span>Adresse :</span>
        <div className="win95-explorer-addr-field">{active.path}</div>
      </div>

      {/* Corps */}
      <div className="win95-explorer-body">

        {/* Sidebar */}
        <div className="win95-explorer-sidebar">
          {CONTACTS.map((c) => (
            <div
              key={c.id}
              className={`win95-explorer-sidebar-item${active.id === c.id ? ' active' : ''}`}
              onClick={() => setActive(c)}
            >
              <span style={{ fontSize: 13 }}>{c.icon}</span>
              <span>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Panneau fiche contact */}
        <div className="win95-explorer-main" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* Header fiche */}
          <div style={{
            display:       'flex',
            alignItems:    'center',
            gap:           10,
            paddingBottom: 8,
            borderBottom:  '1px solid var(--w-dark)',
          }}>
            <span style={{ fontSize: 32 }}>{active.icon}</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 12 }}>Poncelet Tyméo</div>
              <div style={{ color: 'var(--w-darker)', fontSize: 10 }}>
                Étudiant BTS SIO SISR — Recherche stage
              </div>
            </div>
          </div>

          {/* Détail entrée sélectionnée */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span style={{ color: 'var(--w-darker)', minWidth: 70 }}>{active.label} :</span>
              <a
                href={active.href}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{ color: '#000080', textDecoration: 'underline', cursor: 'pointer', fontSize: 11 }}
              >
                {active.value}
              </a>
            </div>
            <div style={{ color: 'var(--w-darker)', fontSize: 10, fontStyle: 'italic' }}>
              {active.desc}
            </div>
          </div>

          {/* Note de disponibilité */}
          <hr className="win95-hr" />
          <div style={{ fontSize: 10, color: '#555', lineHeight: 1.5 }}>
            Disponible pour un stage en administration systèmes,<br />
            réseaux ou cybersécurité. N'hésitez pas à me contacter.
          </div>
        </div>
      </div>

      {/* Statusbar */}
      <div className="win95-statusbar">
        <span className="win95-statusbar-field">{CONTACTS.length} contact(s)</span>
        <span className="win95-statusbar-field">{active.label}</span>
      </div>

    </div>
  )
}
