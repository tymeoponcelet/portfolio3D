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
Pôle Sup DE LA SALLE — Promotion 2025-2026`,
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
    id:    'competences',
    icon:  '🔧',
    label: 'Compétences',
    path:  'C:\\Portfolio\\Biographie\\Compétences',
    text: `INFRASTRUCTURE & RÉSEAUX
  ✓ Windows Server / Active Directory
  ✓ Cisco Packet Tracer (routage, VLANs)
  ✓ Adressage IP / VLSM
  ✓ pfSense / VyOS (firewall, NAT, routage)
  ✓ VirtualBox

CYBERSÉCURITÉ
  ✓ Kali Linux
  ✓ Wireshark (analyse réseau)
  ✓ Hashcat / Hydra (audit de mots de passe)
  ✓ Chiffrement / Hachage

SYSTÈMES LINUX
  ✓ Debian / Ubuntu Server
  ✓ Gestion utilisateurs & droits
  ✓ GLPI (gestion de parc)
  ✓ Zabbix + Grafana (supervision)`,
  },
  {
    id:    'contact',
    icon:  '📞',
    label: 'Contact',
    path:  'C:\\Portfolio\\Biographie\\Contact',
    text: `Email   : tymeo.poncelet@gmail.com
Tél     : 06 10 25 32 34
LinkedIn: linkedin.com/in/tyméo-poncelet-83b667383`,
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
