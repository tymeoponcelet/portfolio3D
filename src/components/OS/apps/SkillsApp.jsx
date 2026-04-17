// src/components/OS/apps/SkillsApp.jsx
import { useState } from 'react'

const CATEGORIES = [
  {
    id:    'infra',
    icon:  '🖧',
    label: 'Infrastructure',
    path:  'C:\\Panneau de configuration\\Infrastructure',
    items: [
      { name: 'Windows Server / AD',   level: 4, max: 5 },
      { name: 'Cisco / Packet Tracer', level: 3, max: 5 },
      { name: 'pfSense / VyOS',        level: 3, max: 5 },
      { name: 'Adressage IP / VLSM',   level: 4, max: 5 },
      { name: 'VirtualBox',            level: 4, max: 5 },
    ],
  },
  {
    id:    'secu',
    icon:  '🔐',
    label: 'Cybersécurité',
    path:  'C:\\Panneau de configuration\\Cybersécurité',
    items: [
      { name: 'Kali Linux',        level: 3, max: 5 },
      { name: 'Wireshark',         level: 3, max: 5 },
      { name: 'Hashcat / Hydra',   level: 2, max: 5 },
      { name: 'Chiffrement',       level: 3, max: 5 },
    ],
  },
  {
    id:    'linux',
    icon:  '🐧',
    label: 'Systèmes Linux',
    path:  'C:\\Panneau de configuration\\Linux',
    items: [
      { name: 'Debian / Ubuntu',   level: 4, max: 5 },
      { name: 'GLPI',              level: 3, max: 5 },
      { name: 'Zabbix + Grafana',  level: 3, max: 5 },
      { name: 'Bash / Scripts',    level: 3, max: 5 },
    ],
  },
]

function ProgressBar({ level, max }) {
  return (
    <div className="win95-progress-track">
      <div
        className="win95-progress-fill"
        style={{ width: `${(level / max) * 100}%` }}
      />
    </div>
  )
}

export function SkillsApp() {
  const [active, setActive] = useState(CATEGORIES[0])

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
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={`win95-explorer-sidebar-item${active.id === cat.id ? ' active' : ''}`}
              onClick={() => setActive(cat)}
            >
              <span style={{ fontSize: 13 }}>{cat.icon}</span>
              <span>{cat.label}</span>
            </div>
          ))}
        </div>

        {/* Panneau */}
        <div className="win95-explorer-main">
          {active.items.map((item) => (
            <div key={item.name} className="win95-skill-row">
              <span className="win95-skill-name">{item.name}</span>
              <ProgressBar level={item.level} max={item.max} />
              <span style={{ minWidth: 28, textAlign: 'right', color: 'var(--w-darker)' }}>
                {item.level}/{item.max}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Statusbar */}
      <div className="win95-statusbar">
        <span className="win95-statusbar-field">{active.items.length} compétence(s)</span>
        <span className="win95-statusbar-field">{active.label}</span>
      </div>

    </div>
  )
}
