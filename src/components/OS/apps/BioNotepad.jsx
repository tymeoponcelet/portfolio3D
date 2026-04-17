// src/components/OS/apps/BioNotepad.jsx
import { useState } from 'react'

const SECTIONS = [
  {
    id:    'formation',
    icon:  '📋',
    label: 'Formation',
    path:  'C:\\Portfolio\\Biographie\\Formation',
    text: `BTS SIO — Services Informatiques aux Organisations
Spécialisation SISR (Systèmes, Réseaux & Cybersécurité)
Pôle Sup DE LA SALLE — Promotion 2025-2026

Baccalauréat, Spécialité Maths/AMC
Mention Assez Bien — Lycée Jean Brito
Promotion 2023-2024`,
  },
  {
    id:    'objectif',
    icon:  '🎯',
    label: 'Objectif',
    path:  'C:\\Portfolio\\Biographie\\Objectif',
    text: `Étudiant passionné par les infrastructures réseau
et la cybersécurité. Je recherche activement un
stage dans les domaines suivants :

  • Administration systèmes & réseaux
  • Cybersécurité offensive / défensive
  • Supervision et monitoring`,
  },
  {
    id:    'experience',
    icon:  '💼',
    label: 'Expérience',
    path:  'C:\\Portfolio\\Biographie\\Expérience',
    text: `ÉQUIPIER — McDonald's, Bain de Bretagne
Juillet-Août 2024 · Février-Août 2025
  • Travail en équipe et coordination
  • Rigueur et respect des procédures
  • Normes d'hygiène et sécurité alimentaire

STAGE — Cabinet Kaliame (expert-comptable)
Février 2023 — 3 jours
  • Tri, classement et vérification de
    documents comptables
  • Organisation et rigueur administrative`,
  },
  {
    id:    'contact',
    icon:  '📞',
    label: 'Contact',
    path:  'C:\\Portfolio\\Biographie\\Contact',
    text: `Email   : tymeo.poncelet@gmail.com
Tél     : 06 10 25 32 34
LinkedIn: linkedin.com/in/tyméo-poncelet-83b667383
GitHub  : github.com/tymeoponcelet`,
  },
]

export function BioNotepad() {
  const [active, setActive] = useState(SECTIONS[0])

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
          {SECTIONS.map((s) => (
            <div
              key={s.id}
              className={`win95-explorer-sidebar-item${active.id === s.id ? ' active' : ''}`}
              onClick={() => setActive(s)}
            >
              <span style={{ fontSize: 13 }}>{s.icon}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Panneau */}
        <div className="win95-explorer-main">
          <pre style={{
            fontFamily: '"Courier New", monospace',
            fontSize:   11,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
            margin:     0,
            color:      '#000',
          }}>
            {active.text}
          </pre>
        </div>
      </div>

      {/* Statusbar */}
      <div className="win95-statusbar">
        <span className="win95-statusbar-field">{SECTIONS.length} section(s)</span>
        <span className="win95-statusbar-field">{active.label}</span>
      </div>

    </div>
  )
}
