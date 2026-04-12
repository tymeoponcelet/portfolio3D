// src/components/OS/PortfolioApp.jsx
import { useState } from 'react'

/* ─── Données ────────────────────────────────────────────── */

const SKILL_SECTIONS = [
  {
    title: 'Infrastructure & Réseaux',
    items: [
      { name: 'Windows Server / AD',  level: 4 },
      { name: 'Cisco / Packet Tracer', level: 3 },
      { name: 'pfSense / VyOS',        level: 3 },
      { name: 'Adressage IP / VLSM',   level: 4 },
      { name: 'VirtualBox',            level: 4 },
    ],
  },
  {
    title: 'Cybersécurité',
    items: [
      { name: 'Kali Linux',      level: 3 },
      { name: 'Wireshark',       level: 3 },
      { name: 'Hashcat / Hydra', level: 2 },
      { name: 'Chiffrement',     level: 3 },
    ],
  },
  {
    title: 'Systèmes Linux',
    items: [
      { name: 'Debian / Ubuntu', level: 4 },
      { name: 'GLPI',            level: 3 },
      { name: 'Zabbix + Grafana',level: 3 },
      { name: 'Bash / Scripts',  level: 3 },
    ],
  },
]

const PROJECTS = [
  {
    id: 'ad',
    category: 'Réseau & Infrastructure',
    icon: '🖧',
    name: 'Active Directory',
    tech: 'Windows Server · AD DS · DNS · GPO · PowerShell',
    desc: "Déploiement d'un domaine Windows Server 2022 complet : AD DS, DNS, DHCP, GPO et scripts PowerShell pour automatiser la gestion des comptes. 30+ utilisateurs, profils itinérants et lecteurs réseau montés automatiquement.",
  },
  {
    id: 'pfsense',
    category: 'Réseau & Infrastructure',
    icon: '🔥',
    name: 'pfSense Firewall',
    tech: 'pfSense · VyOS · NAT · Filtrage · VirtualBox',
    desc: "Étude comparative VyOS / pfSense pour l'interconnexion de sous-réseaux virtuels. Configuration NAT, règles de filtrage et routage statique. Tests de connectivité ping / traceroute.",
  },
  {
    id: 'audit',
    category: 'Cybersécurité',
    icon: '🔐',
    name: 'Audit Sécurité',
    tech: 'Kali Linux · Wireshark · Hashcat · Hydra',
    desc: "Initiation aux outils d'audit en environnement isolé (VMs) : capture et analyse de trames Wireshark, craquage MD5/SHA-1 avec Hashcat, tests force-brute avec Hydra.",
  },
  {
    id: 'zabbix',
    category: 'Supervision',
    icon: '📊',
    name: 'Zabbix + Grafana',
    tech: 'Zabbix 7.4 · Grafana · Ubuntu Server · MySQL · ICMP/SNMP',
    desc: "Supervision de la connectivité internet d'une organisation : Ubuntu Server 22.04, Zabbix 7.4 + MySQL, monitoring ICMP via fping, dashboards Grafana temps réel et alertes espace disque.",
  },
]

const CONTACTS = [
  { icon: '📧', label: 'E-mail',    value: 'tymeo.poncelet@gmail.com',               href: 'mailto:tymeo.poncelet@gmail.com' },
  { icon: '📱', label: 'Téléphone', value: '06 10 25 32 34',                         href: 'tel:+33610253234' },
  { icon: '💼', label: 'LinkedIn',  value: 'linkedin.com/in/tyméo-poncelet-83b667383', href: 'https://www.linkedin.com/in/tym%C3%A9o-poncelet-83b667383' },
  { icon: '🐙', label: 'GitHub',    value: 'github.com/tymeoponcelet',               href: 'https://github.com/tymeoponcelet' },
]

/* ─── Sous-composants ────────────────────────────────────── */

function Bar({ level }) {
  return (
    <span style={{ fontFamily: '"Courier New", monospace', fontSize: 12, letterSpacing: 1 }}>
      {'█'.repeat(level)}{'░'.repeat(5 - level)}
    </span>
  )
}

function SectionTitle({ children }) {
  return (
    <h1 style={{
      fontFamily: '"Times New Roman", serif',
      fontSize: 28,
      fontWeight: 'normal',
      fontStyle: 'italic',
      color: '#000080',
      margin: '0 0 4px',
      lineHeight: 1.1,
    }}>
      {children}
    </h1>
  )
}

function SubTitle({ children }) {
  return (
    <div style={{ fontWeight: 'bold', fontSize: 13, marginBottom: 14, color: '#222' }}>
      {children}
    </div>
  )
}

function Divider() {
  return <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '14px 0' }} />
}

/* ─── Pages ─────────────────────────────────────────────── */

function PageHome() {
  return (
    <div style={{ maxWidth: 480 }}>
      <SectionTitle>Bienvenue</SectionTitle>
      <SubTitle>Je suis Tyméo Poncelet — Étudiant BTS SIO SISR</SubTitle>
      <p style={{ fontSize: 11, lineHeight: 1.7, color: '#333', marginBottom: 14 }}>
        Passionné par les infrastructures réseau et la cybersécurité, je suis actuellement
        étudiant en BTS SIO option SISR au Pôle Sup DE LA SALLE (promotion 2025-2026).
        Je recherche activement un stage dans l'administration systèmes &amp; réseaux,
        la cybersécurité ou la supervision.
      </p>
      <p style={{ fontSize: 11, lineHeight: 1.7, color: '#333', marginBottom: 20 }}>
        Merci de prendre le temps de visiter mon portfolio. N'hésitez pas à parcourir mes
        projets et à me contacter directement !
      </p>

      <Divider />

      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px',
        boxShadow: 'var(--border-raised)',
        background: 'var(--w-surface)',
        cursor: 'default',
      }}>
        <span style={{ fontSize: 22 }}>📄</span>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 2 }}>Consulter mon CV ?</div>
          <div style={{ fontSize: 10, color: '#555' }}>
            Disponible sur demande — contactez-moi par e-mail.
          </div>
        </div>
      </div>

      <Divider />

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        {[
          { icon: '🎓', label: 'Formation', value: 'BTS SIO SISR' },
          { icon: '🏫', label: 'École', value: 'Pôle Sup DE LA SALLE' },
          { icon: '📅', label: 'Promo', value: '2025 – 2026' },
        ].map((item) => (
          <div key={item.label} style={{ textAlign: 'center', minWidth: 80 }}>
            <div style={{ fontSize: 20, marginBottom: 2 }}>{item.icon}</div>
            <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
            <div style={{ fontSize: 10, fontWeight: 'bold' }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function PageCompetences() {
  return (
    <div style={{ maxWidth: 420 }}>
      <SectionTitle>Compétences</SectionTitle>
      <SubTitle>Mes outils &amp; technologies</SubTitle>

      {SKILL_SECTIONS.map((section, si) => (
        <div key={section.title} style={{ marginBottom: si < SKILL_SECTIONS.length - 1 ? 16 : 0 }}>
          <div style={{
            fontSize: 10,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: 1,
            color: '#000080',
            borderBottom: '1px solid #ccc',
            paddingBottom: 3,
            marginBottom: 6,
          }}>
            {section.title}
          </div>
          {section.items.map((item) => (
            <div key={item.name} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '2px 0',
              fontSize: 11,
            }}>
              <span style={{ color: '#222' }}>{item.name}</span>
              <Bar level={item.level} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function PageProjets() {
  const [selected, setSelected] = useState(null)
  const active = PROJECTS.find((p) => p.id === selected)

  return (
    <div style={{ maxWidth: 500 }}>
      <SectionTitle>Projets</SectionTitle>
      <SubTitle>Mes réalisations &amp; formations</SubTitle>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: active ? 16 : 0 }}>
        {PROJECTS.map((p) => (
          <div
            key={p.id}
            onClick={() => setSelected(selected === p.id ? null : p.id)}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '8px 10px',
              cursor: 'pointer',
              boxShadow: selected === p.id ? 'var(--border-sunken)' : 'var(--border-raised)',
              background: selected === p.id ? 'var(--w-surface)' : 'var(--w-surface-h)',
            }}
          >
            <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{p.icon}</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: 11 }}>{p.name}</div>
              <div style={{ fontSize: 9, color: '#555', fontStyle: 'italic', marginTop: 1 }}>{p.tech}</div>
            </div>
          </div>
        ))}
      </div>

      {active && (
        <>
          <Divider />
          <div style={{ padding: '10px 12px', background: '#fff', boxShadow: 'var(--border-sunken)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 18 }}>{active.icon}</span>
              <span style={{ fontWeight: 'bold', fontSize: 12 }}>{active.name}</span>
            </div>
            <div style={{ fontSize: 10, color: '#000080', fontStyle: 'italic', marginBottom: 6 }}>{active.tech}</div>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: '#333', margin: 0 }}>{active.desc}</p>
          </div>
        </>
      )}
    </div>
  )
}

function PageContact() {
  return (
    <div style={{ maxWidth: 400 }}>
      <SectionTitle>Contact</SectionTitle>
      <SubTitle>Prenons contact !</SubTitle>

      <p style={{ fontSize: 11, lineHeight: 1.7, color: '#333', marginBottom: 16 }}>
        Je suis disponible pour un stage en administration systèmes, réseaux ou
        cybersécurité. N'hésitez pas à me contacter directement par l'un des
        canaux ci-dessous.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {CONTACTS.map((c) => (
          <div key={c.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 10px',
            boxShadow: 'var(--border-raised)',
            background: 'var(--w-surface)',
          }}>
            <span style={{ fontSize: 14, width: 18, flexShrink: 0, textAlign: 'center' }}>{c.icon}</span>
            <span style={{ fontSize: 10, color: '#555', minWidth: 58, flexShrink: 0 }}>{c.label} :</span>
            <a
              href={c.href}
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: 11, color: '#000080', textDecoration: 'underline', cursor: 'pointer' }}
              onClick={(e) => e.stopPropagation()}
            >
              {c.value}
            </a>
          </div>
        ))}
      </div>

      <Divider />

      <div style={{ fontSize: 10, color: '#666', lineHeight: 1.6 }}>
        * Tous les messages sont traités directement par Tyméo Poncelet.
      </div>
    </div>
  )
}

/* ─── Composant principal ─────────────────────────────────── */

const NAV = ['HOME', 'COMPÉTENCES', 'PROJETS', 'CONTACT']

export function PortfolioApp() {
  const [page, setPage] = useState('HOME')

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      fontFamily: 'var(--w-font)',
      fontSize: 11,
      overflow: 'hidden',
    }}>
      {/* ── Sidebar ── */}
      <div style={{
        width: 150,
        flexShrink: 0,
        background: '#fff',
        borderRight: '1px solid var(--w-dark)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '10px 10px 8px',
          borderBottom: '1px solid var(--w-dark)',
        }}>
          <div style={{ fontWeight: 'bold', fontSize: 12, lineHeight: 1.2 }}>Tyméo Poncelet</div>
          <div style={{ fontSize: 9, color: '#555', marginTop: 2 }}>BTS SIO SISR</div>
          <div style={{ fontSize: 9, color: '#888' }}>Showcase '26</div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          {NAV.map((item) => (
            <div key={item}>
              <div
                style={{
                  padding: '6px 10px',
                  cursor: 'pointer',
                  color: page === item ? '#000' : '#000080',
                  fontWeight: page === item ? 'bold' : 'normal',
                  background: page === item ? 'var(--w-surface)' : 'transparent',
                  fontSize: 11,
                  letterSpacing: 0.3,
                  userSelect: 'none',
                }}
                onClick={() => setPage(item)}
              >
                {item}
              </div>
              <div style={{ height: 1, background: '#ddd', margin: '0 6px' }} />
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '6px 8px',
          fontSize: 8,
          color: '#aaa',
          borderTop: '1px solid var(--w-dark)',
          lineHeight: 1.4,
        }}>
          © 2026 Tyméo Poncelet
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '18px 20px 24px',
        background: '#fff',
      }}>
        {page === 'HOME'        && <PageHome />}
        {page === 'COMPÉTENCES' && <PageCompetences />}
        {page === 'PROJETS'     && <PageProjets />}
        {page === 'CONTACT'     && <PageContact />}
      </div>
    </div>
  )
}
