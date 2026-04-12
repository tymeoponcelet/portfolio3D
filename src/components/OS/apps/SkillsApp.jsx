// src/components/OS/apps/SkillsApp.jsx

const SKILL_SECTIONS = [
  {
    title: 'Infrastructure & Réseaux',
    items: [
      { name: 'Windows Server / AD',   level: 4, max: 5 },
      { name: 'Cisco / Packet Tracer', level: 3, max: 5 },
      { name: 'pfSense / VyOS',        level: 3, max: 5 },
      { name: 'Adressage IP / VLSM',   level: 4, max: 5 },
      { name: 'VirtualBox',            level: 4, max: 5 },
    ],
  },
  {
    title: 'Cybersécurité',
    items: [
      { name: 'Kali Linux',        level: 3, max: 5 },
      { name: 'Wireshark',         level: 3, max: 5 },
      { name: 'Hashcat / Hydra',   level: 2, max: 5 },
      { name: 'Chiffrement',       level: 3, max: 5 },
    ],
  },
  {
    title: 'Systèmes Linux',
    items: [
      { name: 'Debian / Ubuntu',   level: 4, max: 5 },
      { name: 'GLPI',              level: 3, max: 5 },
      { name: 'Zabbix + Grafana',  level: 3, max: 5 },
      { name: 'Bash / Scripts',    level: 3, max: 5 },
    ],
  },
]

function Bar({ level, max }) {
  return (
    <span style={{ fontFamily: '"Courier New", monospace', fontSize: 11 }}>
      {'█'.repeat(level)}{'░'.repeat(max - level)}
    </span>
  )
}

export function SkillsApp() {
  return (
    <div style={{
      padding: '8px 10px', fontFamily: 'var(--w-font)', fontSize: 11,
      display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', height: '100%',
    }}>
      {SKILL_SECTIONS.map((section) => (
        <div key={section.title}>
          <div style={{
            fontWeight: 'bold', fontSize: 11, marginBottom: 4,
            borderBottom: '1px solid var(--w-dark)', paddingBottom: 2,
            color: '#000080',
          }}>
            {section.title}
          </div>
          {section.items.map((item) => (
            <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '1px 0' }}>
              <span style={{ minWidth: 160 }}>{item.name}</span>
              <Bar level={item.level} max={item.max} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
